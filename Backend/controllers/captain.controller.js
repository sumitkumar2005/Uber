const captainModel = require('../models/captain.model');
const captainService = require('../services/captain.service');
const blackListTokenModel = require('../models/blackListToken.model');
const { validationResult } = require('express-validator');


module.exports.registerCaptain = async (req, res, next) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { fullname, email, password, vehicle } = req.body;

    const isCaptainAlreadyExist = await captainModel.findOne({ email });

    if (isCaptainAlreadyExist) {
        return res.status(400).json({ message: 'Captain already exist' });
    }


    const hashedPassword = await captainModel.hashPassword(password);

    const captain = await captainService.createCaptain({
        firstname: fullname.firstname,
        lastname: fullname.lastname,
        email,
        password: hashedPassword,
        color: vehicle.color,
        plate: vehicle.plate,
        capacity: vehicle.capacity,
        vehicleType: vehicle.vehicleType
    });

    const token = captain.generateAuthToken();

    res.status(201).json({ token, captain });

}

module.exports.loginCaptain = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    const captain = await captainModel.findOne({ email }).select('+password');

    if (!captain) {
        return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await captain.comparePassword(password);

    if (!isMatch) {
        return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Set captain status to active by default when they log in
    await captainModel.findByIdAndUpdate(captain._id, { status: 'active' });
    captain.status = 'active'; // Update the local object too

    const token = captain.generateAuthToken();

    res.cookie('token', token);

    console.log(`Captain ${captain.fullname.firstname} ${captain.fullname.lastname} logged in and set to active by default`);

    res.status(200).json({ token, captain });
}

module.exports.getCaptainProfile = async (req, res, next) => {
    res.status(200).json({ captain: req.captain });
}

module.exports.logoutCaptain = async (req, res, next) => {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[ 1 ];

    await blackListTokenModel.create({ token });

    // Set captain status to inactive when they log out
    await captainModel.findByIdAndUpdate(req.captain._id, { status: 'inactive' });

    console.log(`Captain ${req.captain.fullname.firstname} ${req.captain.fullname.lastname} logged out and set to inactive`);

    res.clearCookie('token');

    res.status(200).json({ message: 'Logout successfully' });
}

module.exports.toggleCaptainStatus = async (req, res, next) => {
    try {
        const captainId = req.captain._id;
        const currentStatus = req.captain.status;
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active';

        const updatedCaptain = await captainModel.findByIdAndUpdate(
            captainId,
            { status: newStatus },
            { new: true }
        );

        console.log(`Captain ${req.captain.fullname.firstname} ${req.captain.fullname.lastname} status changed from ${currentStatus} to ${newStatus}`);

        res.status(200).json({
            message: `Status updated to ${newStatus}`,
            captain: updatedCaptain
        });
    } catch (error) {
        console.error('Error toggling captain status:', error);
        res.status(500).json({ message: 'Failed to update status' });
    }
}
