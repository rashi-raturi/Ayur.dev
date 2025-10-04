import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../context/AppContext";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { assets } from "../assets/assets";

const Login = () => {
  const navigate = useNavigate();
  const { backendUrl, token, setToken } = useContext(AppContext);

  const [state, setState] = useState("Sign Up");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (token) {
      navigate("/");
    }
  }, [token, navigate]);

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    console.log('Form submitted, state:', state);
    console.log('Backend URL:', backendUrl);

    if (state === "Sign Up") {
      // Validation for sign up
      console.log('Sign Up form data:', { name, email, password, confirmPassword, gender, dob });
      
      if (!name || !email || !password || !confirmPassword || !gender || !dob) {
        toast.error("Please fill all required fields");
        return;
      }

      if (password !== confirmPassword) {
        toast.error("Passwords do not match");
        return;
      }

      if (password.length < 6) {
        toast.error("Password must be at least 6 characters long");
        return;
      }

      setIsLoading(true);
      console.log('Sending registration request to:', backendUrl + "/api/user/register");
      try {
        const { data } = await axios.post(backendUrl + "/api/user/register", {
          name,
          email,
          password,
          gender,
          dob,
        });

        console.log('Registration response:', data);
        
        if (data.success) {
          console.log('Registration successful, token received');
          toast.success(
            "Account created successfully! Please login with your credentials."
          );
          // Switch to login mode and keep the email filled
          setState("Login");
          // Keep email filled, clear other fields
          setName("");
          setPassword("");
          setConfirmPassword("");
          setGender("");
          setDob("");
          // Email remains filled for easy login
        } else {
          console.error('Registration failed:', data.message);
          toast.error(data.message || "Registration failed");
        }
      } catch (error) {
        console.error('Registration error:', error);
        console.error('Error response:', error.response?.data);
        toast.error(
          error.response?.data?.message ||
            "Registration failed. Please try again."
        );
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsLoading(true);
      console.log('Sending login request to:', backendUrl + "/api/user/login");
      console.log('Login form data:', { email, password: '***' });
      
      try {
        const { data } = await axios.post(backendUrl + "/api/user/login", {
          email,
          password,
        });

        console.log('Login response:', data);
        
        if (data.success) {
          console.log('Login successful, storing token');
          localStorage.setItem("token", data.token);
          setToken(data.token);
          toast.success("Welcome back!");
        } else {
          console.error('Login failed:', data.message);
          toast.error(data.message || "Login failed");
        }
      } catch (error) {
        console.error('Login error:', error);
        console.error('Error response:', error.response?.data);
        toast.error(
          error.response?.data?.message || "Login failed. Please try again."
        );
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-gray-50 flex items-center justify-center p-4">
      {/* Login Card */}
      <div className="w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg">
              <img
                src={assets.logo}
                alt="Ayur.dev"
                className="w-15 h-15 rounded-2xl"
              />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Ayur.dev</h1>
          <p className="text-gray-500">Holistic Healthcare Management System</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
          {/* Welcome Header */}
          <div className="flex items-start gap-3 mb-8">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg
                className="w-5 h-5 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {state === "Sign Up" ? "Create Account" : "Welcome Back"}
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {state === "Sign Up"
                  ? "Join our holistic healthcare platform"
                  : "Sign in to your account"}
              </p>
            </div>
          </div>

          <form onSubmit={onSubmitHandler} className="space-y-5">
            {/* Name Field - Only for Sign Up */}
            {state === "Sign Up" && (
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Full Name
                </label>
                <input
                  onChange={(e) => setName(e.target.value)}
                  value={name}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  type="text"
                  placeholder="Enter your full name"
                  required
                />
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Email Address
              </label>
              <input
                onChange={(e) => setEmail(e.target.value)}
                value={email}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                type="email"
                placeholder="you@example.com"
                required
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  onChange={(e) => setPassword(e.target.value)}
                  value={password}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all pr-12"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Confirm Password - Only for Sign Up */}
            {state === "Sign Up" && (
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    value={confirmPassword}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all pr-12"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={20} />
                    ) : (
                      <Eye size={20} />
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Gender and DOB - Only for Sign Up */}
            {state === "Sign Up" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Gender
                  </label>
                  <select
                    onChange={(e) => setGender(e.target.value)}
                    value={gender}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    required
                  >
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Date of Birth
                  </label>
                  <input
                    onChange={(e) => setDob(e.target.value)}
                    value={dob}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    type="date"
                    required
                  />
                </div>
              </div>
            )}

            {/* Forgot Password - Only for Login */}
            {state === "Login" && (
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gray-900 text-white py-3.5 rounded-xl font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span>
                    {state === "Sign Up"
                      ? "Creating account..."
                      : "Signing in..."}
                  </span>
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                  <span>{state === "Sign Up" ? "Create Account" : "Sign In"}</span>
                </>
              )}
            </button>
          </form>

          {/* Toggle between Login and Sign Up */}
          <div className="text-center pt-6 border-t border-gray-100 mt-6">
            {state === "Sign Up" ? (
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <button
                  onClick={() => setState("Login")}
                  className="text-gray-900 font-medium hover:underline transition-all"
                >
                  Sign In
                </button>
              </p>
            ) : (
              <p className="text-sm text-gray-600">
                Don't have an account?{" "}
                <button
                  onClick={() => setState("Sign Up")}
                  className="text-gray-900 font-medium hover:underline transition-all"
                >
                  Create Account
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-8">
          © 2025 Ayur.dev. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Login;
