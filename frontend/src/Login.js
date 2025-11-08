import React from 'react';
import { useState } from 'react';

import supabase from './supabase';


const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState(null);
    const [isSignUp, setIsSignUp] = useState(false);

    const handleLogin = async (e) => {
        e?.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (error) {
                setError(error.message);
                console.error('Login error:', error);
            } else {
                setMessage('Login successful!');
                // The auth state change will be handled by the listener in CalorieCounterApp
            }
        } catch (err) {
            setError('An unexpected error occurred');
            console.error('Login exception:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSignUp = async (e) => {
        e?.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        if (!email || !password) {
            setError('Please enter both email and password');
            setLoading(false);
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            setLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase.auth.signUp({
                email: email,
                password: password,
            });

            if (error) {
                setError(error.message);
                console.error('Sign up error:', error);
            } else {
                setMessage('Sign up successful! Please check your email to verify your account.');
                // Optionally switch to login mode
                setTimeout(() => {
                    setIsSignUp(false);
                    setMessage(null);
                }, 3000);
            }
        } catch (err) {
            setError('An unexpected error occurred');
            console.error('Sign up exception:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isSignUp) {
            handleSignUp(e);
        } else {
            handleLogin(e);
        }
    };

    return (
        <div id="login-container" style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            backgroundColor: '#0a0a0a',
            padding: '1rem'
        }}>
            <div id="login-form" style={{
                backgroundColor: '#1a1a1a',
                padding: '2rem',
                borderRadius: '12px',
                width: '100%',
                maxWidth: '400px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
            }}>
                <h1 style={{
                    color: 'white',
                    marginBottom: '1.5rem',
                    textAlign: 'center',
                    fontSize: '1.5rem'
                }}>
                    {isSignUp ? 'Sign Up' : 'Login'}
                </h1>
                
                {error && (
                    <div style={{
                        backgroundColor: 'rgba(239, 68, 68, 0.2)',
                        border: '1px solid rgba(239, 68, 68, 0.5)',
                        color: '#fca5a5',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        marginBottom: '1rem',
                        fontSize: '0.875rem'
                    }}>
                        {error}
                    </div>
                )}

                {message && (
                    <div style={{
                        backgroundColor: 'rgba(34, 197, 94, 0.2)',
                        border: '1px solid rgba(34, 197, 94, 0.5)',
                        color: '#86efac',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        marginBottom: '1rem',
                        fontSize: '0.875rem'
                    }}>
                        {message}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            marginBottom: '1rem',
                            backgroundColor: '#2a2a2a',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '8px',
                            color: 'white',
                            fontSize: '1rem',
                            boxSizing: 'border-box'
                        }}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            marginBottom: '1rem',
                            backgroundColor: '#2a2a2a',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '8px',
                            color: 'white',
                            fontSize: '1rem',
                            boxSizing: 'border-box'
                        }}
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        onClick={handleSubmit}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            marginBottom: '0.5rem',
                            backgroundColor: loading ? '#3a3a3a' : '#22c55e',
                            border: 'none',
                            borderRadius: '8px',
                            color: 'white',
                            fontSize: '1rem',
                            fontWeight: '600',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            transition: 'background-color 0.2s'
                        }}
                    >
                        {loading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Login')}
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setIsSignUp(!isSignUp);
                            setError(null);
                            setMessage(null);
                        }}
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            backgroundColor: 'transparent',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '8px',
                            color: 'white',
                            fontSize: '0.875rem',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            transition: 'border-color 0.2s'
                        }}
                    >
                        {isSignUp ? 'Already have an account? Login' : "Don't have an account? Sign Up"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;