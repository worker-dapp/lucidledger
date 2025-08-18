import React, { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import apiClient from "../api/apiClient";

const EmployeeRegister = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const navigate = useNavigate();

  // Handle Registration
  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      setError("All fields are required.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await apiClient.signup({
        first_name: firstName,
        last_name: lastName,
        email: email.trim().toLowerCase(),
        password,
        role: "employee",
      });

      if (error) {
        setError(error.message || "Registration failed. Please try again.");
        return;
      }

      setSuccess("Employee registered successfully!");

      // Clear form fields
      setFirstName("");
      setLastName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");

      // Redirect to login page after 2 seconds
      setTimeout(() => {
        navigate("/employeeLogin");
      }, 2000);
    } catch (err) {
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] flex flex-col">
      <Navbar />
      <div className="flex justify-center items-center p-6 flex-grow">
        <div className="w-full max-w-lg p-10">
          {/* Centered Heading */}
          <h2 className="text-5xl font-semibold text-center text-[#0D3B66] mb-8">
            Employee Register
          </h2>

          {error && <p className="text-red-500 text-center mb-4">{error}</p>}
          {success && (
            <p className="text-green-500 text-center mb-4">{success}</p>
          )}

          <form className="flex flex-col gap-6" onSubmit={handleRegister}>
            {/* First & Last Name */}
            <div className="flex flex-col md:flex-row gap-5">
              <input
                type="text"
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="w-full p-4 border border-[#F4D35E] bg-transparent rounded-xl placeholder-gray-600 text-gray-900"
              />
              <input
                type="text"
                placeholder="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="w-full p-4 border border-[#F4D35E] bg-transparent rounded-xl placeholder-gray-600 text-gray-900"
              />
            </div>

            {/* Email */}
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-4 border border-[#F4D35E] bg-transparent rounded-xl placeholder-gray-600 text-gray-900"
            />

            {/* Password */}
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full p-4 border border-[#F4D35E] bg-transparent rounded-xl placeholder-gray-600 text-gray-900"
            />

            {/* Confirm Password with Toggle */}
            <div className="relative w-full">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full p-4 border border-[#F4D35E] bg-transparent rounded-xl placeholder-gray-600 text-gray-900 pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-5 right-5 text-[#EDAA76] text-xl">
                {showPassword ? <FaEye /> : <FaEyeSlash />}
              </button>
            </div>

            {/* Register Button */}
            <button
              type="submit"
              className="w-full font-medium p-4 bg-[#EE964B] hover:bg-[#d97b33] rounded-xl shadow-md transition-all hover:scale-105 hover:shadow-lg text-white"
              disabled={loading}>
              {loading ? "Registering..." : "Register"}
            </button>
          </form>

          {/* Sign In Link */}
          <Link to="/employeeLogin">
            <h1 className="text-gray-700 text-md pt-6 text-center">
              Already have an account?
              <span className="text-[#EE964B] underline cursor-pointer ml-1">
                Sign In
              </span>
            </h1>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default EmployeeRegister;
