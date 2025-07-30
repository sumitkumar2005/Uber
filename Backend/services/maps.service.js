const axios = require('axios');
const captainModel = require('../models/captain.model');

module.exports.getAddressCoordinate = async (address) => {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;

    try {
        const response = await axios.get(url);
        if (response.data.status === 'OK') {
            const location = response.data.results[ 0 ].geometry.location;
            return {
                ltd: location.lat,
                lng: location.lng
            };
        } else {
            throw new Error('Unable to fetch coordinates');
        }
    } catch (error) {
        console.error(error);
        throw error;
    }
}

module.exports.getDistanceTime = async (origin, destination) => {
    if (!origin || !destination) {
        throw new Error('Origin and destination are required');
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&key=${apiKey}`;

    try {


        const response = await axios.get(url);
        if (response.data.status === 'OK') {

            if (response.data.rows[ 0 ].elements[ 0 ].status === 'ZERO_RESULTS') {
                throw new Error('No routes found');
            }

            return response.data.rows[ 0 ].elements[ 0 ];
        } else {
            throw new Error('Unable to fetch distance and time');
        }

    } catch (err) {
        console.error(err);
        throw err;
    }
}

module.exports.getAutoCompleteSuggestions = async (input) => {
    if (!input) {
        throw new Error('query is required');
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${apiKey}`;

    try {
        const response = await axios.get(url);
        if (response.data.status === 'OK') {
            return response.data.predictions.map(prediction => prediction.description).filter(value => value);
        } else {
            throw new Error('Unable to fetch suggestions');
        }
    } catch (err) {
        console.error(err);
        throw err;
    }
}

module.exports.getCaptainsInTheRadius = async (ltd, lng, radius) => {

    // radius in km
    console.log(`\n=== CAPTAIN RADIUS SEARCH ===`);
    console.log(`Pickup Location - Latitude: ${ltd}, Longitude: ${lng}`);
    console.log(`Search Radius: ${radius} km`);

    // First, let's check ALL captains in the database for debugging
    const allCaptains = await captainModel.find({});
    console.log(`\nTotal captains in database: ${allCaptains.length}`);

    allCaptains.forEach((captain, index) => {
        console.log(`All Captain ${index + 1}:`);
        console.log(`  ID: ${captain._id}`);
        console.log(`  Name: ${captain.fullname.firstname} ${captain.fullname.lastname}`);
        console.log(`  Location: Lat ${captain.location?.ltd || 'undefined'}, Lng ${captain.location?.lng || 'undefined'}`);
        console.log(`  Status: ${captain.status}`);
        console.log(`  SocketId: ${captain.socketId || 'null'}`);

        if (captain.location?.ltd && captain.location?.lng) {
            // Calculate distance
            const distance = Math.sqrt(
                Math.pow((captain.location.ltd - ltd) * 111, 2) +
                Math.pow((captain.location.lng - lng) * 111, 2)
            );
            console.log(`  Distance from pickup: ${distance.toFixed(2)} km`);
            console.log(`  Within ${radius}km radius: ${distance <= radius ? 'YES' : 'NO'}`);
        } else {
            console.log(`  Distance: Cannot calculate (missing location)`);
        }
        console.log(`---`);
    });

    console.log(`\nTesting different geospatial query approaches...`);

    // Test 1: Simple geospatial query without $centerSphere
    console.log(`Test 1: Using $center instead of $centerSphere`);
    const captainsSimple = await captainModel.find({
        "location.ltd": { $exists: true },
        "location.lng": { $exists: true },
        $expr: {
            $lte: [
                {
                    $sqrt: {
                        $add: [
                            { $pow: [{ $multiply: [{ $subtract: ["$location.ltd", ltd] }, 111] }, 2] },
                            { $pow: [{ $multiply: [{ $subtract: ["$location.lng", lng] }, 111] }, 2] }
                        ]
                    }
                },
                radius
            ]
        }
    });
    console.log(`Found ${captainsSimple.length} captains with manual distance calculation`);

    // Test 2: Try the original geospatial query
    try {
        const captainsGeo = await captainModel.find({
            location: {
                $geoWithin: {
                    $centerSphere: [ [ lng, ltd ], radius / 6371 ]
                }
            }
        });
        console.log(`Test 2: Found ${captainsGeo.length} captains with $centerSphere query`);
    } catch (error) {
        console.log(`Test 2: Geospatial query failed:`, error.message);
    }

    // For now, let's use the manual calculation method that works
    const workingCaptains = await captainModel.find({
        "location.ltd": { $exists: true },
        "location.lng": { $exists: true },
        status: 'active',
        socketId: { $exists: true, $ne: null },
        $expr: {
            $lte: [
                {
                    $sqrt: {
                        $add: [
                            { $pow: [{ $multiply: [{ $subtract: ["$location.ltd", ltd] }, 111] }, 2] },
                            { $pow: [{ $multiply: [{ $subtract: ["$location.lng", lng] }, 111] }, 2] }
                        ]
                    }
                },
                radius
            ]
        }
    });

    console.log(`\nFinal result: Found ${workingCaptains.length} active captains within ${radius}km using manual calculation`);
    workingCaptains.forEach((captain, index) => {
        console.log(`Working Captain ${index + 1}:`);
        console.log(`  ID: ${captain._id}`);
        console.log(`  Name: ${captain.fullname.firstname} ${captain.fullname.lastname}`);
        console.log(`  Location: Lat ${captain.location.ltd}, Lng ${captain.location.lng}`);
        console.log(`  Status: ${captain.status}`);
        console.log(`  SocketId: ${captain.socketId}`);

        const distance = Math.sqrt(
            Math.pow((captain.location.ltd - ltd) * 111, 2) +
            Math.pow((captain.location.lng - lng) * 111, 2)
        );
        console.log(`  Distance: ${distance.toFixed(2)} km`);
        console.log(`---`);
    });

    console.log(`=== END CAPTAIN SEARCH ===\n`);

    return workingCaptains;

}