import React, { useEffect, useRef, useState } from 'react'
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import axios from 'axios';
import 'remixicon/fonts/remixicon.css'
import LocationSearchPanel from '../components/LocationSearchPanel';
import VehiclePanel from '../components/VehiclePanel';
import ConfirmRide from '../components/ConfirmRide';
import LookingForDriver from '../components/LookingForDriver';
import WaitingForDriver from '../components/WaitingForDriver';
import { SocketContext } from '../context/SocketContext';
import { useContext } from 'react';
import { UserDataContext } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import LiveTracking from '../components/LiveTracking';

const Home = () => {
    const [ pickup, setPickup ] = useState('')
    const [ destination, setDestination ] = useState('')
    const [ panelOpen, setPanelOpen ] = useState(false)
    const vehiclePanelRef = useRef(null)
    const confirmRidePanelRef = useRef(null)
    const vehicleFoundRef = useRef(null)
    const waitingForDriverRef = useRef(null)
    const noDriverFoundRef = useRef(null) // New ref for no driver found panel
    const panelRef = useRef(null)
    const panelCloseRef = useRef(null)
    const [ vehiclePanel, setVehiclePanel ] = useState(false)
    const [ confirmRidePanel, setConfirmRidePanel ] = useState(false)
    const [ vehicleFound, setVehicleFound ] = useState(false)
    const [ waitingForDriver, setWaitingForDriver ] = useState(false)
    const [ pickupSuggestions, setPickupSuggestions ] = useState([])
    const [ destinationSuggestions, setDestinationSuggestions ] = useState([])
    const [ activeField, setActiveField ] = useState(null)
    const [ fare, setFare ] = useState({})
    const [ vehicleType, setVehicleType ] = useState(null)
    const [ ride, setRide ] = useState(null)
    const [ noDriverFound, setNoDriverFound ] = useState(false) // New state for no driver notification
    const [ searchTimer, setSearchTimer ] = useState(null) // Timer for driver search timeout

    const navigate = useNavigate()

    const { socket } = useContext(SocketContext)
    const { user } = useContext(UserDataContext)

    useEffect(() => {
        if (!user) return; // Add null check for user

        console.log('User joining socket:', user._id);
        socket.emit("join", { userType: "user", userId: user._id })
    }, [ user ])

    socket.on('ride-confirmed', ride => {
        // Clear the search timer since a driver was found
        if (searchTimer) {
            clearTimeout(searchTimer);
            setSearchTimer(null);
        }
        setNoDriverFound(false);
        setVehicleFound(false);
        setWaitingForDriver(true);
        setRide(ride);
    })

    socket.on('ride-started', ride => {
        console.log("ride")
        setWaitingForDriver(false)
        navigate('/riding', { state: { ride } }) // Updated navigate to include ride data
    })


    const handlePickupChange = async (e) => {
        setPickup(e.target.value)
        try {
            const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/maps/get-suggestions`, {
                params: { input: e.target.value },
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }

            })
            setPickupSuggestions(response.data)
        } catch {
            // handle error
        }
    }

    const handleDestinationChange = async (e) => {
        setDestination(e.target.value)
        try {
            const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/maps/get-suggestions`, {
                params: { input: e.target.value },
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            })
            setDestinationSuggestions(response.data)
        } catch {
            // handle error
        }
    }

    const submitHandler = (e) => {
        e.preventDefault()
    }

    useGSAP(function () {
        if (panelOpen) {
            gsap.to(panelRef.current, {
                height: '70%',
                padding: 24
                // opacity:1
            })
            gsap.to(panelCloseRef.current, {
                opacity: 1
            })
        } else {
            gsap.to(panelRef.current, {
                height: '0%',
                padding: 0
                // opacity:0
            })
            gsap.to(panelCloseRef.current, {
                opacity: 0
            })
        }
    }, [ panelOpen ])


    useGSAP(function () {
        if (vehiclePanel) {
            gsap.to(vehiclePanelRef.current, {
                transform: 'translateY(0)'
            })
        } else {
            gsap.to(vehiclePanelRef.current, {
                transform: 'translateY(100%)'
            })
        }
    }, [ vehiclePanel ])

    useGSAP(function () {
        if (confirmRidePanel) {
            gsap.to(confirmRidePanelRef.current, {
                transform: 'translateY(0)'
            })
        } else {
            gsap.to(confirmRidePanelRef.current, {
                transform: 'translateY(100%)'
            })
        }
    }, [ confirmRidePanel ])

    useGSAP(function () {
        if (vehicleFound) {
            gsap.to(vehicleFoundRef.current, {
                transform: 'translateY(0)'
            })
        } else {
            gsap.to(vehicleFoundRef.current, {
                transform: 'translateY(100%)'
            })
        }
    }, [ vehicleFound ])

    useGSAP(function () {
        if (waitingForDriver) {
            gsap.to(waitingForDriverRef.current, {
                transform: 'translateY(0)'
            })
        } else {
            gsap.to(waitingForDriverRef.current, {
                transform: 'translateY(100%)'
            })
        }
    }, [ waitingForDriver ])

    useGSAP(function () {
        if (noDriverFound) {
            gsap.to(noDriverFoundRef.current, {
                transform: 'translateY(0)'
            })
        } else {
            gsap.to(noDriverFoundRef.current, {
                transform: 'translateY(100%)'
            })
        }
    }, [ noDriverFound ])


    async function findTrip() {
        setVehiclePanel(true)
        setPanelOpen(false)

        const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/rides/get-fare`, {
            params: { pickup, destination },
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
            }
        })


        setFare(response.data)


    }

    async function createRide() {
        try {
            console.log('Creating ride with:', { pickup, destination, vehicleType });

            const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/rides/create`, {
                pickup,
                destination,
                vehicleType
            }, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            })

            console.log('Ride created successfully:', response.data);

            // Set the ride data for potential future use
            setRide(response.data);

            // Start the search timer when a ride is created
            startSearchTimer();

        } catch (error) {
            console.error('Error creating ride:', error);

            // Show error to user
            alert('Failed to create ride. Please try again.');

            // Reset the UI state on error
            setVehicleFound(false);
            setConfirmRidePanel(true); // Go back to confirm panel
        }
    }

    // Function to handle no driver found timeout
    const handleNoDriverTimeout = () => {
        console.log('No driver found within time limit');
        setVehicleFound(false);
        setNoDriverFound(true);
        setSearchTimer(null);
    };

    // Function to start search timer when ride is created
    const startSearchTimer = () => {
        const timer = setTimeout(handleNoDriverTimeout, 30000); // 30 seconds timeout
        setSearchTimer(timer);
    };

    // Function to cancel search and reset UI
    const cancelSearch = () => {
        if (searchTimer) {
            clearTimeout(searchTimer);
            setSearchTimer(null);
        }
        setVehicleFound(false);
        setNoDriverFound(false);
        setConfirmRidePanel(true); // Go back to confirm ride panel
    };

    return (
        <div className='h-screen relative overflow-hidden'>
            <img className='w-16 absolute left-5 top-5' src="https://upload.wikimedia.org/wikipedia/commons/c/cc/Uber_logo_2018.png" alt="" />
            <div className='h-screen w-screen'>
                {/* image for temporary use  */}
                <LiveTracking />
            </div>
            <div className=' flex flex-col justify-end h-screen absolute top-0 w-full'>
                <div className='h-[30%] p-6 bg-white relative'>
                    <h5 ref={panelCloseRef} onClick={() => {
                        setPanelOpen(false)
                    }} className='absolute opacity-0 right-6 top-6 text-2xl'>
                        <i className="ri-arrow-down-wide-line"></i>
                    </h5>
                    <h4 className='text-2xl font-semibold'>Find a trip</h4>
                    <form className='relative py-3' onSubmit={(e) => {
                        submitHandler(e)
                    }}>
                        <div className="line absolute h-16 w-1 top-[50%] -translate-y-1/2 left-5 bg-gray-700 rounded-full"></div>
                        <input
                            onClick={() => {
                                setPanelOpen(true)
                                setActiveField('pickup')
                            }}
                            value={pickup}
                            onChange={handlePickupChange}
                            className='bg-[#eee] px-12 py-2 text-lg rounded-lg w-full'
                            type="text"
                            placeholder='Add a pick-up location'
                        />
                        <input
                            onClick={() => {
                                setPanelOpen(true)
                                setActiveField('destination')
                            }}
                            value={destination}
                            onChange={handleDestinationChange}
                            className='bg-[#eee] px-12 py-2 text-lg rounded-lg w-full  mt-3'
                            type="text"
                            placeholder='Enter your destination' />
                    </form>
                    <button
                        onClick={findTrip}
                        className='bg-black text-white px-4 py-2 rounded-lg mt-3 w-full'>
                        Find Trip
                    </button>
                </div>
                <div ref={panelRef} className='bg-white h-0'>
                    <LocationSearchPanel
                        suggestions={activeField === 'pickup' ? pickupSuggestions : destinationSuggestions}
                        setPanelOpen={setPanelOpen}
                        setVehiclePanel={setVehiclePanel}
                        setPickup={setPickup}
                        setDestination={setDestination}
                        activeField={activeField}
                    />
                </div>
            </div>
            <div ref={vehiclePanelRef} className='fixed w-full z-10 bottom-0 translate-y-full bg-white px-3 py-10 pt-12'>
                <VehiclePanel
                    selectVehicle={setVehicleType}
                    fare={fare} setConfirmRidePanel={setConfirmRidePanel} setVehiclePanel={setVehiclePanel} />
            </div>
            <div ref={confirmRidePanelRef} className='fixed w-full z-10 bottom-0 translate-y-full bg-white px-3 py-6 pt-12'>
                <ConfirmRide
                    createRide={createRide}
                    pickup={pickup}
                    destination={destination}
                    fare={fare}
                    vehicleType={vehicleType}

                    setConfirmRidePanel={setConfirmRidePanel} setVehicleFound={setVehicleFound} />
            </div>
            <div ref={vehicleFoundRef} className='fixed w-full z-10 bottom-0 translate-y-full bg-white px-3 py-6 pt-12'>
                <LookingForDriver
                    createRide={createRide}
                    pickup={pickup}
                    destination={destination}
                    fare={fare}
                    vehicleType={vehicleType}
                    setVehicleFound={setVehicleFound} />
            </div>
            <div ref={waitingForDriverRef} className='fixed w-full  z-10 bottom-0  bg-white px-3 py-6 pt-12'>
                <WaitingForDriver
                    ride={ride}
                    setVehicleFound={setVehicleFound}
                    setWaitingForDriver={setWaitingForDriver}
                    waitingForDriver={waitingForDriver} />
            </div>
            <div ref={noDriverFoundRef} className='fixed w-full z-10 bottom-0 translate-y-full bg-white px-3 py-6 pt-12'>
                <div>
                    <h5 className='p-1 text-center w-[93%] absolute top-0' onClick={() => {
                        setNoDriverFound(false)
                    }}><i className="text-3xl text-gray-200 ri-arrow-down-wide-line"></i></h5>
                    <h3 className='text-2xl font-semibold mb-5 text-red-600'>No Driver Found</h3>

                    <div className='flex flex-col items-center text-center mb-6'>
                        <div className='w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4'>
                            <i className="text-4xl text-red-500 ri-close-circle-line"></i>
                        </div>
                        <p className='text-lg text-gray-700 mb-2'>Sorry, no drivers are available in your area right now.</p>
                        <p className='text-sm text-gray-500'>Please try again later or try expanding your search area.</p>
                    </div>

                    <div className='flex gap-2 justify-between flex-col items-center'>
                        <div className='w-full mt-3'>
                            <div className='flex items-center gap-5 p-3 border-b-2'>
                                <i className="ri-map-pin-user-fill"></i>
                                <div>
                                    <h3 className='text-lg font-medium'>From</h3>
                                    <p className='text-sm -mt-1 text-gray-600'>{pickup}</p>
                                </div>
                            </div>
                            <div className='flex items-center gap-5 p-3 border-b-2'>
                                <i className="text-lg ri-map-pin-2-fill"></i>
                                <div>
                                    <h3 className='text-lg font-medium'>To</h3>
                                    <p className='text-sm -mt-1 text-gray-600'>{destination}</p>
                                </div>
                            </div>
                            <div className='flex items-center gap-5 p-3'>
                                <i className="ri-currency-line"></i>
                                <div>
                                    <h3 className='text-lg font-medium'>₹{fare[vehicleType] || '0'}</h3>
                                    <p className='text-sm -mt-1 text-gray-600'>Estimated Fare</p>
                                </div>
                            </div>
                        </div>

                        <div className='mt-5 w-full space-y-3'>
                            <button
                                onClick={() => {
                                    setNoDriverFound(false);
                                    setVehicleFound(true);
                                    startSearchTimer(); // Restart the search
                                }}
                                className='w-full bg-blue-600 text-white font-semibold p-3 rounded-lg'
                            >
                                Try Again
                            </button>
                            <button
                                onClick={cancelSearch}
                                className='w-full bg-gray-300 text-gray-700 font-semibold p-3 rounded-lg'
                            >
                                Cancel Ride
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Home