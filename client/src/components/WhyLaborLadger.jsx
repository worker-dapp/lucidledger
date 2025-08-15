import React from "react";
import Lottie from "react-lottie";
import { IoIosArrowForward } from "react-icons/io";

// Import Lottie JSON files
import paymentAnimation from "../assets/lottie/payment.json";
import jobSearchAnimation from "../assets/lottie/search-jobs.json";

const defaultOptions = (animationData) => ({
  loop: true,
  autoplay: true,
  animationData: animationData,
  rendererSettings: {
    preserveAspectRatio: "xMidYMid slice",
  },
});

const WhyLaborLedger = () => {
  return (
    <div className="py-20   bg-[#FFFFFF] ">
      {/* Section Title */}
      <h1 className="text-5xl text-center font-extrabold text-[#0D3B66] mb-16">
        Why <span className="text-[#EE964B]">LUCID LEDGER?</span>
      </h1>

      {/* Easy Payments Section */}
      <div className="flex flex-col md:flex-row gap-16 justify-center items-center px-10">
        {/* Animation */}
        <div className="w-full md:w-1/3 flex justify-center">
          <Lottie
            options={defaultOptions(paymentAnimation)}
            height={250}
            width={250}
          />
        </div>

        {/* Text Content */}
        <div className="flex flex-col gap-5 text-center md:text-left max-w-lg">
          <h2 className="text-3xl font-bold text-[#0D3B66]">Easy Payments</h2>
          <div className="flex flex-col gap-3 text-xl text-gray-700">
            <p className="flex items-center hover:translate-x-2 transition-all">
              <IoIosArrowForward className="text-[#F4D35E]" /> Automate all
              payments
            </p>
            <p className="flex items-center hover:translate-x-2 transition-all">
              <IoIosArrowForward className="text-[#F4D35E]" /> Employees get
              paid without delay
            </p>
            <p className="flex items-center hover:translate-x-2 transition-all">
              <IoIosArrowForward className="text-[#F4D35E]" /> Immutable Payment
              Records
            </p>
            <p className="flex items-center hover:translate-x-2 transition-all">
              <IoIosArrowForward className="text-[#F4D35E]" /> Real-Time Payment
              Tracking
            </p>
          </div>
        </div>
      </div>

      {/* Job Searching Section */}
      <div className="flex flex-col md:flex-row-reverse gap-16 justify-center items-center px-10 mt-16">
        {/* Animation */}
        <div className="w-full md:w-1/3 flex justify-center">
          <Lottie
            options={defaultOptions(jobSearchAnimation)}
            height={250}
            width={250}
          />
        </div>

        {/* Text Content */}
        <div className="flex flex-col gap-5 text-center md:text-left max-w-lg">
          <h2 className="text-4xl font-bold text-gray-900">
            Simplified Hiring and Job Searching
          </h2>
          <div className="flex flex-col gap-3 text-xl text-gray-700">
            <p className="flex items-center hover:translate-x-2 transition-all">
              <IoIosArrowForward className="text-[#F4D35E]" /> AI-powered job
              recommendations
            </p>
            <p className="flex items-center hover:translate-x-2 transition-all">
              <IoIosArrowForward className="text-[#F4D35E]" /> Employers find
              top talent instantly
            </p>
            <p className="flex items-center hover:translate-x-2 transition-all">
              <IoIosArrowForward className="text-[#F4D35E]" /> Easy and quick
              job applications
            </p>
            <p className="flex items-center hover:translate-x-2 transition-all">
              <IoIosArrowForward className="text-[#F4D35E]" /> Smart
              contract-based hiring
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhyLaborLedger;
