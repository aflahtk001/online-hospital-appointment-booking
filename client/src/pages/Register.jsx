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
        <div className='flex items-center justify-center min-h-screen bg-gray-100'>
            <div className='w-full max-w-md p-8 space-y-6 bg-white rounded shadow-md'>
                <div className='flex flex-col items-center justify-center'>
                    <h1 className='text-3xl font-bold flex items-center gap-2'>
                        <FaUser /> Register
                    </h1>
                    <p className='text-gray-500'>Create a new account</p>
                </div>

                <form onSubmit={onSubmit} className='space-y-4'>
                    <div>
                        <input
                            type='text'
                            className='w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                            id='name'
                            name='name'
                            value={name}
                            placeholder='Enter your name'
                            onChange={onChange}
                        />
                    </div>
                    <div>
                        <input
                            type='email'
                            className='w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                            id='email'
                            name='email'
                            value={email}
                            placeholder='Enter your email'
                            onChange={onChange}
                        />
                    </div>
                    <div>
                        <input
                            type='password'
                            className='w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                            id='password'
                            name='password'
                            value={password}
                            placeholder='Enter password'
                            onChange={onChange}
                        />
                    </div>
                    <div>
                        <input
                            type='password'
                            className='w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                            id='confirmPassword'
                            name='confirmPassword'
                            value={confirmPassword}
                            placeholder='Confirm password'
                            onChange={onChange}
                        />
                    </div>

                    <div>
                        <label className='block text-gray-700 text-sm font-bold mb-2'>I am a:</label>
                        <select
                            name="role"
                            value={role}
                            onChange={onChange}
                            className='w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                        >
                            <option value="patient">Patient</option>
                            <option value="doctor">Doctor</option>
                            <option value="hospital_admin">Hospital Admin</option>
                            {/* Super Admin cannot register here */}
                        </select>
                    </div>

                    <button type='submit' className='w-full px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 font-bold'>
                        Register
                    </button>
                </form>
                <div className='text-center'>
                    <p>Already have an account? <Link to="/login" className='text-blue-500 hover:underline'>Login</Link></p>
                </div>
            </div>
        </div>
    );
}

export default Register;
