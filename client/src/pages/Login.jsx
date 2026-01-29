import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { login, reset } from '../features/auth/authSlice';
import { FaSignInAlt } from 'react-icons/fa';

function Login() {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    const { email, password } = formData;

    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { user, isLoading, isError, isSuccess, message } = useSelector(
        (state) => state.auth
    );

    useEffect(() => {
        if (isError) {
            alert(message); // Could use a toast here
        }

        if (isSuccess || user) {
            // Redirect based on role
            if (user) {
                switch (user.role) {
                    case 'patient': navigate('/patient-dashboard'); break;
                    case 'doctor': navigate('/doctor-dashboard'); break;
                    case 'hospital_admin': navigate('/hospital-dashboard'); break;
                    case 'super_admin': navigate('/admin-dashboard'); break;
                    default: navigate('/');
                }
            }
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

        const userData = {
            email,
            password,
        };

        dispatch(login(userData));
    };

    if (isLoading) {
        return <div className="text-center mt-20">Loading...</div>;
    }

    return (
        <div className='flex items-center justify-center min-h-screen bg-gray-100'>
            <div className='w-full max-w-md p-8 space-y-6 bg-white rounded shadow-md'>
                <div className='flex flex-col items-center justify-center'>
                    <h1 className='text-3xl font-bold flex items-center gap-2'>
                        <FaSignInAlt /> Login
                    </h1>
                    <p className='text-gray-500'>Login to your account</p>
                </div>

                <form onSubmit={onSubmit} className='space-y-4'>
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

                    <button type='submit' className='w-full px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 font-bold'>
                        Submit
                    </button>
                </form>
                <div className='text-center'>
                    <p>Don't have an account? <Link to="/register" className='text-blue-500 hover:underline'>Register</Link></p>
                </div>
            </div>
        </div>
    );
}

export default Login;
