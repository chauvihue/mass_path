import React from 'react';
import { useState } from 'react';

import supabase from './supabase';


const Login = () => {

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    async function signUpNewUser() {
        const { data, error } = await supabase.auth.signUp({
          email: 'valid.email@supabase.io',
          password: 'example-password',
          options: {
            emailRedirectTo: 'https://example.com/welcome',
          },
        })
      }
    const handleLogin = async () => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });
    };

    return (
        <div id="login-container">
            <div id="login-form">
                <h1>Login</h1>
                <input type="text" placeholder="Username" />
                <input type="password" placeholder="Password" />
                <button>Login</button>
            </div>
        </div>
    );
};

export default Login;