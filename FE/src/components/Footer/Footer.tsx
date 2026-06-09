import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-slate-50 py-16 px-[10%] border-t border-slate-200">
      <div className="flex justify-between flex-wrap gap-10">
        <div className="flex flex-col gap-4">
          <h4 className="text-base font-extrabold text-slate-900 m-0">Parking Building</h4>
          <a href="#" className="text-slate-500 text-sm font-medium hover:text-primary-500 transition-colors no-underline">Book Parking</a>
          <a href="#" className="text-slate-500 text-sm font-medium hover:text-primary-500 transition-colors no-underline">Sell Parking</a>
        </div>
        <div className="flex flex-col gap-4">
          <h4 className="text-base font-extrabold text-slate-900 m-0">Company</h4>
          <a href="#" className="text-slate-500 text-sm font-medium hover:text-primary-500 transition-colors no-underline">Company</a>
          <a href="#" className="text-slate-500 text-sm font-medium hover:text-primary-500 transition-colors no-underline">Solutions</a>
        </div>
        <div className="flex flex-col gap-4">
          <h4 className="text-base font-extrabold text-slate-900 m-0">Legal</h4>
          <a href="#" className="text-slate-500 text-sm font-medium hover:text-primary-500 transition-colors no-underline">Privacy Policy</a>
          <a href="#" className="text-slate-500 text-sm font-medium hover:text-primary-500 transition-colors no-underline">Terms of Service</a>
        </div>
        <div className="w-full md:w-auto text-left md:self-end text-sm text-slate-400 mt-5 md:mt-0">
          © 2024 Parking Building, Inc. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
