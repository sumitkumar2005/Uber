import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

const ConfirmRidePopUp = (props) => {
    const [ otp, setOtp ] = useState('')
    const navigate = useNavigate()

    console.log('ConfirmRidePopUp props:', props); // Debug log

    const submitHander = async (e) => {
        e.preventDefault()

        if (!props.ride?._id) {
            alert('No ride selected');
            return;
        }

        try {
            const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/rides/start-ride`, {
                params: {
                    rideId: props.ride._id,
                    otp: otp
                },
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            })

            if (response.status === 200) {
                if (props.setConfirmRidePopupPanel) props.setConfirmRidePopupPanel(false);
                if (props.setRidePopupPanel) props.setRidePopupPanel(false);
                navigate('/captain-riding', { state: { ride: props.ride } })
            }
        } catch (error) {
            console.error('Error starting ride:', error);
            alert('Failed to start ride. Please check the OTP and try again.');
        }
    }

    return (
        <div>
            <h5 className='p-1 text-center w-[93%] absolute top-0' onClick={() => {
                if (props.setRidePopupPanel) props.setRidePopupPanel(false);
            }}><i className="text-3xl text-gray-200 ri-arrow-down-wide-line"></i></h5>
            <h3 className='text-2xl font-semibold mb-5'>Confirm this ride to Start</h3>
            <div className='flex items-center justify-between p-3 border-2 border-yellow-400 rounded-lg mt-4'>
                <div className='flex items-center gap-3 '>
                    <img className='h-12 rounded-full object-cover w-12' src="https://i.pinimg.com/236x/af/26/28/af26280b0ca305be47df0b799ed1b12b.jpg" alt="" />
                    <h2 className='text-lg font-medium capitalize'>
                        {props.ride?.user?.fullname?.firstname ?
                            `${props.ride.user.fullname.firstname} ${props.ride.user.fullname.lastname || ''}` :
                            'User'
                        }
                    </h2>
                </div>
                <h5 className='text-lg font-semibold'>2.2 KM</h5>
            </div>
            <div className='flex gap-2 justify-between flex-col items-center'>
                <div className='w-full mt-5'>
                    <div className='flex items-center gap-5 p-3 border-b-2'>
                        <i className="ri-map-pin-user-fill"></i>
                        <div>
                            <h3 className='text-lg font-medium'>562/11-A</h3>
                            <p className='text-sm -mt-1 text-gray-600'>{props.ride?.pickup || 'Pickup location'}</p>
                        </div>
                    </div>
                    <div className='flex items-center gap-5 p-3 border-b-2'>
                        <i className="text-lg ri-map-pin-2-fill"></i>
                        <div>
                            <h3 className='text-lg font-medium'>562/11-A</h3>
                            <p className='text-sm -mt-1 text-gray-600'>{props.ride?.destination || 'Destination'}</p>
                        </div>
                    </div>
                    <div className='flex items-center gap-5 p-3'>
                        <i className="ri-currency-line"></i>
                        <div>
                            <h3 className='text-lg font-medium'>₹{props.ride?.fare || '0'} </h3>
                            <p className='text-sm -mt-1 text-gray-600'>Cash Cash</p>
                        </div>
                    </div>
                </div>

                <div className='mt-6 w-full'>
                    <form onSubmit={submitHander}>
                        <input
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            type="text"
                            className='bg-[#eee] px-6 py-4 font-mono text-lg rounded-lg w-full mt-3'
                            placeholder='Enter OTP'
                            required
                        />

                        <button
                            type="submit"
                            className='w-full mt-5 text-lg flex justify-center bg-green-600 text-white font-semibold p-3 rounded-lg'
                        >
                            Confirm
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                if (props.setConfirmRidePopupPanel) props.setConfirmRidePopupPanel(false);
                                if (props.setRidePopupPanel) props.setRidePopupPanel(false);
                            }}
                            className='w-full mt-2 bg-red-600 text-lg text-white font-semibold p-3 rounded-lg'
                        >
                            Cancel
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default ConfirmRidePopUp
