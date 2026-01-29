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
        <div className='flex items-center justify-center min-h-screen bg-apple-gray'>
            <div className='w-full max-w-md p-10 space-y-8 bg-white rounded-3xl shadow-lg'>
                <div className='flex flex-col items-center justify-center space-y-2'>
                    <h1 className='text-3xl font-semibold tracking-tight text-apple-text flex items-center gap-2'>
                        <FaSignInAlt className="text-apple-blue" /> Login
                    </h1>
                    <p className='text-apple-subtext text-lg'>Sign in to the hospital portal</p>
                </div>

                <form onSubmit={onSubmit} className='space-y-6'>
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

                    <button type='submit' className='w-full px-5 py-3.5 text-white bg-apple-blue rounded-full hover:bg-blue-600 font-medium transition-colors text-lg shadow-sm hover:shadow-md'>
                        Sign In
                    </button>
                </form>
                <div className='text-center'>
                    <p className="text-apple-subtext">Don't have an account? <Link to="/register" className='text-apple-blue hover:underline font-medium'>Register</Link></p>
                </div>
            </div>
        </div>
    );
}

export default Login;
