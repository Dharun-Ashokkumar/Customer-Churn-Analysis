import { useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";

export default function Login() {

  const [username,setUsername] = useState("");
  const [password,setPassword] = useState("");
  const [isRegister,setIsRegister] = useState(false);

  const handleSubmit = async (e) => {

    e.preventDefault();

    try {

      const url = isRegister
        ? "http://127.0.0.1:8000/auth/register"
        : "http://127.0.0.1:8000/auth/login";

      const res = await axios.post(url,{
        username,
        password
      });

      if(res.data.status==="success"){

        localStorage.setItem("auth","true");
        localStorage.setItem("username",username);

        window.location.href="/";

      }

      if(res.data.status==="user_created"){

        alert("Account created successfully! Please login.");

        setIsRegister(false);

      }

      if(res.data.status==="invalid_credentials"){

        alert("Invalid username or password");

      }

    } catch(err){
      console.error(err);
    }

  };

  return (

    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-black via-gray-900 to-black">

      <motion.div
        className="bg-gray-900 p-10 rounded-xl shadow-xl w-96"
        initial={{opacity:0,y:50}}
        animate={{opacity:1,y:0}}
      >

        <h1 className="text-3xl font-bold text-white text-center mb-2">
          🍔 Food Churn Analytics
        </h1>

        <p className="text-gray-400 text-center mb-6 text-sm">
          AI‑powered system to predict customer churn and improve retention.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">

          <input
            placeholder="Username"
            className="w-full p-3 rounded-lg bg-black text-white border border-gray-700"
            onChange={(e)=>setUsername(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full p-3 rounded-lg bg-black text-white border border-gray-700"
            onChange={(e)=>setPassword(e.target.value)}
          />

          <button
            className="w-full bg-green-500 hover:bg-green-600 py-3 rounded-lg font-semibold transition"
          >
            {isRegister ? "Create Account" : "Login"}
          </button>

        </form>

        <p
          className="text-gray-400 text-center mt-5 cursor-pointer hover:text-green-400"
          onClick={()=>setIsRegister(!isRegister)}
        >
          {isRegister
            ? "Already have an account? Login"
            : "New user? Create account"}
        </p>

      </motion.div>

    </div>
  );
}