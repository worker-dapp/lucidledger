import React from "react";
import img from "../assets/banner.png";
import img1 from "../assets/feature1.png";
import img2 from "../assets/feature2.png";
import img3 from "../assets/feature3.png";
import img4 from "../assets/feature4.png";

const Banner = () => {
  return (
    <div className="bg-[#FFFFFF] py-10 ">
      <div className="w-full flex items-center justify-between bg-[##FFF9E5] px-16">
        <div className="text-3xl md:text-4xl font-semibold text-center md:text-left text-[#0D3B66] space-y-2">
          <p>Transparent.</p>
          <p className="text-[#EE964B]">Fair.</p>
          <p>Decentralized.</p>
        </div>
        <img
          src={img}
          alt="laborledger-banner"
          className="w-3/4 md:w-1/3 mt-8 md:mt-0"
        />
      </div>
      
      <div className="w-full bg-[#FFFFFF] py-16 px-6 md:px-20">
        <h2 className="text-2xl md:text-3xl font-bold text-[#0D3B66] text-center mb-12">
          What Makes <span className="text-[#EE964B]">LUCID LEDGER</span>{" "}
          Different?
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10">
          {/* Feature 1 */}
          <div className="flex flex-col items-center text-center bg-white shadow-md rounded-xl p-6 transition-transform hover:scale-105 hover:shadow-lg">
            <img src={img1} alt="Grievance Mechanism" className="w-16 mb-4" />
            <p className="text-[#0D3B66] font-semibold text-lg">
              Grievance Mechanism
            </p>
          </div>

          {/* Feature 2 */}
          <div className="flex flex-col items-center text-center bg-white shadow-md rounded-xl p-6 transition-transform hover:scale-105 hover:shadow-lg">
            <img src={img2} alt="Simplified Payments" className="w-16 mb-4" />
            <p className="text-[#0D3B66] font-semibold text-lg">
              Simplified Payments
            </p>
          </div>

          {/* Feature 3 */}
          <div className="flex flex-col items-center text-center bg-white shadow-md rounded-xl p-6 transition-transform hover:scale-105 hover:shadow-lg">
            <img src={img3} alt="Easy Job Hunt" className="w-16 mb-4" />
            <p className="text-[#0D3B66] font-semibold text-lg">
              Easy Job Hunt
            </p>
          </div>

          {/* Feature 4 */}
          <div className="flex flex-col items-center text-center bg-white shadow-md rounded-xl p-6 transition-transform hover:scale-105 hover:shadow-lg">
            <img src={img4} alt="Dispute Management" className="w-16 mb-4" />
            <p className="text-[#0D3B66] font-semibold text-lg">
              Dispute Management
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Banner;
