
import React from "react";

const Header = () => {
  return (
    <header className="bg-ps-blue-inky text-white py-4">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center">
          <div className="mr-2">
            <svg width="30" height="30" viewBox="0 0 230 230" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M115 0C51.6 0 0 51.6 0 115C0 178.4 51.6 230 115 230C178.4 230 230 178.4 230 115C230 51.6 178.4 0 115 0ZM134.3 170.9L74.1 134.2V76.4L134.3 113.1V170.9ZM74.1 163L134.3 199.7V170.9L74.1 134.2V163ZM145.2 189.7L75 147.5V88.5L145.2 130.7V189.7Z" fill="#FF1675"/>
            </svg>
          </div>
          <h1 className="text-xl font-bold">Pluralsight User Management</h1>
        </div>
      </div>
    </header>
  );
};

export default Header;
