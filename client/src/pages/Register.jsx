import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { register, reset } from '../features/auth/authSlice';
import { FaUser } from 'react-icons/fa';

function Register() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'patient', // Default role
    });

    const { name, email, password, confirmPassword, role } = formData;

    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { user, isLoading, isError, isSuccess, message } = useSelector(
        (state) => state.auth
    );

    useEffect(() => {
        if (isError) {
            alert(message);
        }

        if (isSuccess || user) {
            navigate('/');
        }

        dispatch(reset());
    }, [user, isError, isSuccess, message, navigate, dispatch]);

    const onChange = (e) => {
        setFormData((prevState) => ({
            ...prevState,
            [e.target.name]: e.target.value,
        }));
    };

    const onSubmit = (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            alert('Passwords do not match');
        } else {
            const userData = {
                name,
                email,
                password,
                role,
            };

            dispatch(register(userData));
        }
    };

    if (isLoading) {
        return <div className="text-center mt-20">Loading...</div>;
    }

    return (
        <div className='flex items-center justify-center min-h-screen bg-apple-gray'>
            <div className='w-full max-w-md p-10 space-y-8 bg-white rounded-3xl shadow-lg'>
                <div className='flex flex-col items-center justify-center space-y-2'>
                    <h1 className='text-3xl font-semibold tracking-tight text-apple-text flex items-center gap-2'>
                        <FaUser className="text-apple-blue" /> Register
                    </h1>
                    <p className='text-apple-subtext text-lg'>Create your new account</p>
                </div>

                <form onSubmit={onSubmit} className='space-y-5'>
                    <div>
                        <input
                            type='text'
                            className='w-full px-5 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-apple-blue/50 transition-all text-apple-text placeholder-gray-400 bg-gray-50/50'
                            id='name'
                            name='name'
                            value={name}
                            placeholder='Full Name'
                            onChange={onChange}
                        />
                    </div>
                    <div>
                        <input
                            type='email'
                            className='w-full px-5 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-apple-blue/50 transition-all text-apple-text placeholder-gray-400 bg-gray-50/50'
                            id='email'
                            name='email'
                            value={email}
                            placeholder='Email address'
                            onChange={onChange}
                        />
                    </div>
                    <div>
                        <input
                            type='password'
                            className='w-full px-5 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-apple-blue/50 transition-all text-apple-text placeholder-gray-400 bg-gray-50/50'
                            id='password'
                            name='password'
                            value={password}
                            placeholder='Password'
                            onChange={onChange}
                        />
                    </div>
                    <div>
                        <input
                            type='password'
                            className='w-full px-5 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-apple-blue/50 transition-all text-apple-text placeholder-gray-400 bg-gray-50/50'
                            id='confirmPassword'
                            name='confirmPassword'
                            value={confirmPassword}
                            placeholder='Confirm Password'
                            onChange={onChange}
                        />
                    </div>

                    <div>
                        <label className='block text-apple-subtext text-sm font-medium mb-2 pl-1'>I am a:</label>
                        <select
                            name="role"
                            value={role}
                            onChange={onChange}
                            className='w-full px-5 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-apple-blue/50 transition-all text-apple-text bg-gray-50/50 cursor-pointer appearance-none'
                        >
                            <option value="patient">Patient</option>
                            <option value="doctor">Doctor</option>
                            <option value="hospital_admin">Hospital Admin</option>
                        </select>
                    </div>

                    <button type='submit' className='w-full px-5 py-3.5 text-white bg-apple-blue rounded-full hover:bg-blue-600 font-medium transition-colors text-lg shadow-sm hover:shadow-md'>
                        Create Account
                    </button>
                </form>
                <div className='text-center'>
                    <p className="text-apple-subtext">Already have an account? <Link to="/login" className='text-apple-blue hover:underline font-medium'>Sign In</Link></p>
                </div>
            </div>
        </div>
    );
}

export default Register;
