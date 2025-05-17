import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateUserProfile, getUserProfile } from '../../redux/actions/authActions';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const Profile = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // Accessing user, loading, error, and message from Redux state
    const { user, loading, error, message } = useSelector((state) => state.auth);

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [business_name, setBusinessName] = useState('');
    const [registration_number, setRegistrationNumber] = useState('');
    const [contact_number, setContactNumber] = useState('');

    // Fetch user profile if it's not available or if a refresh is needed
    useEffect(() => {
        if (!user) {
            dispatch(getUserProfile());  // Dispatch to fetch the profile if not already loaded
        }

        // Update state with user profile data once it is fetched
        if (user) {
            setName(user.name || '');
            setEmail(user.email || '');
            setBusinessName(user.business_name || '');
            setRegistrationNumber(user.registration_number || '');
            setContactNumber(user.contact_number || '');
        }

        // Show toast notifications for success or error messages
        if (message) {
            toast.success(message);
            dispatch({ type: 'CLEAR_PROFILE_MESSAGE' });
        } else if (error) {
            toast.error(error);
            dispatch({ type: 'CLEAR_PROFILE_ERROR' });
        }
    }, [dispatch, user, loading, message, error]);  // Ensure correct dependencies

    const handleSubmit = (e) => {
        e.preventDefault();

        const updatedData = {};

        // Only update fields that have changed
        if (name !== user?.name) updatedData.name = name;
        if (email !== user?.email) updatedData.email = email;
        if (business_name !== user?.business_name) updatedData.business_name = business_name;
        if (registration_number !== user?.registration_number) updatedData.registration_number = registration_number;
        if (contact_number !== user?.contact_number) updatedData.contact_number = contact_number;

        // Dispatch the action to update the user profile
        dispatch(updateUserProfile(updatedData));
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    // Display message if no profile data is available yet
    if (!user) {
        return <div>No profile data available yet.</div>;
    }

    return (
        <div className="profile-container">
            <h2>Edit Profile</h2>
            <form onSubmit={handleSubmit}>
                {/* Name input field */}
                <div>
                    <label htmlFor="name">Name:</label>
                    <p>{user?.name || 'No name provided'}</p> {/* Display existing name */}
                    <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </div>

                {/* Email input field */}
                <div>
                    <label htmlFor="email">Email:</label>
                    <p>{user?.email || 'No email provided'}</p> {/* Display existing email */}
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>

                {/* Business Name input field */}
                <div>
                    <label htmlFor="business_name">Business Name:</label>
                    <p>{user?.business_name || 'N/A'}</p> {/* Display existing business name */}
                    <input
                        type="text"
                        id="business_name"
                        value={business_name}
                        onChange={(e) => setBusinessName(e.target.value)}
                    />
                </div>

                {/* Registration Number input field */}
                <div>
                    <label htmlFor="registration_number">Registration Number:</label>
                    <p>{user?.registration_number || 'N/A'}</p> {/* Display existing registration number */}
                    <input
                        type="text"
                        id="registration_number"
                        value={registration_number}
                        onChange={(e) => setRegistrationNumber(e.target.value)}
                    />
                </div>

                {/* Contact Number input field */}
                <div>
                    <label htmlFor="contact_number">Contact Number:</label>
                    <p>{user?.contact_number || 'N/A'}</p> {/* Display existing contact number */}
                    <input
                        type="text"
                        id="contact_number"
                        value={contact_number}
                        onChange={(e) => setContactNumber(e.target.value)}
                    />
                </div>

                <button type="submit">Update Profile</button>
            </form>
        </div>
    );
};

export default Profile;
