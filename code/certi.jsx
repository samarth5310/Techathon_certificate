import React from 'react';

const Certificate = ({ participantName = "JOHN DOE", certificateId = "BGMIT-2026-001" }) => {
  return (
    <div className="flex items-center justify-center p-8 bg-gray-100 min-h-screen">
      <div 
        id="certificate-container"
        className="relative w-[1123px] h-[794px] bg-[#FFF9F9] border-[16px] border-[#D4E4BC] p-1"
        style={{ fontFamily: "'Times New Roman', Times, serif" }}
      >
        {/* Inner Pink Border */}
        <div className="w-full h-full border-[2px] border-[#E91E63] relative p-12">
          
          {/* Header Logos and Title */}
          <div className="flex justify-between items-start mb-4">
            <img src="/path-to/B_V_V_SANGHA_LOGO.png" alt="Logo Left" className="w-24 h-24 object-contain" />
            <div className="text-center flex-1 mx-4">
              <h3 className="text-[#8B9D44] text-lg font-bold tracking-widest leading-tight">
                B.V.V SANGHA'S
              </h3>
              <h2 className="text-[#8B9D44] text-xl font-bold tracking-tighter">
                BILURU GURUBASAV MAHASWAMIJI INSTITUTE OF TECHNOLOGY, MUDHOL
              </h2>
            </div>
            <img src="/path-to/SWAMIJI_IMAGE.png" alt="Swamiji" className="w-24 h-24 object-contain" />
          </div>

          {/* Decorative Top Line */}
          <div className="flex items-center justify-center mb-6">
            <div className="h-[2px] bg-[#8B9D44] w-1/3"></div>
            <div className="mx-2 w-2 h-2 rounded-full bg-[#8B9D44]"></div>
            <div className="h-[2px] bg-[#8B9D44] w-1/3"></div>
          </div>

          {/* Techathon Title */}
          <div className="text-center mb-4">
            <img 
              src="/path-to/TECHATHON_FONT.png" 
              alt="TECHATHON 1.0" 
              className="mx-auto h-20 object-contain"
            />
            <h1 className="text-[#E91E63] text-2xl tracking-widest mt-2 uppercase">
              Certificate of Participation
            </h1>
            <p className="text-black text-lg italic mt-4">This is to certify that</p>
          </div>

          {/* Participant Name Section */}
          <div className="text-center mt-8 mb-4">
            <h2 className="text-3xl font-serif text-black uppercase tracking-wide min-h-[40px]">
              {participantName}
            </h2>
            <div className="w-2/3 h-[1px] bg-black mx-auto mt-1 flex items-center justify-center">
               <span className="text-xs">◆</span>
            </div>
          </div>

          {/* Event Details */}
          <div className="text-center px-16 leading-relaxed text-black text-lg">
            <p className="mb-4">
              has participated in the 24-Hour Hackathon, held during 30<sup>th</sup> April-1<sup>st</sup> May 2026.
            </p>
            <p className="italic font-light">
              The participant demonstrated enthusiasm, creativity, and commitment to innovation throughout the event.
            </p>
          </div>

          {/* Signatures Section */}
          <div className="absolute bottom-20 left-12 right-12 flex justify-between text-center items-end">
            <div>
              <p className="text-[#8B9D44] font-bold text-sm uppercase">Prof. Varun Sarvade</p>
              <p className="text-[#8B9D44] text-[10px]">(HOD, CSE, BGMIT)</p>
            </div>
            <div>
              <p className="text-[#8B9D44] font-bold text-sm uppercase">Prof. TBA</p>
              <p className="text-[#8B9D44] text-[10px]">(EVENT COORDINATOR)</p>
            </div>
            <div>
              <p className="text-[#8B9D44] font-bold text-sm uppercase">Dr. Shravankumar Kerur</p>
              <p className="text-[#8B9D44] text-[10px]">(PRINCIPAL, BGMIT)</p>
            </div>
          </div>

          {/* Bottom Decorations & Metadata */}
          <div className="absolute bottom-6 left-6 flex items-end">
            <div className="mr-4">
               {/* Replace with a QR component like qrcode.react */}
               <div className="w-10 h-10 bg-gray-300 border border-black flex items-center justify-center text-[6px]">QR CODE</div>
            </div>
            <p className="text-[#E91E63] text-[8px] uppercase font-bold">
              Certificate ID: {certificateId}
            </p>
          </div>
          
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-1/3 h-2 bg-[#8B9D44]"></div>
        </div>
      </div>
    </div>
  );
};

export default Certificate;