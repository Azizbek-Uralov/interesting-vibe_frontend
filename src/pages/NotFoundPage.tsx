import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="py-28 text-center space-y-4">
      <h1 className="text-7xl font-black text-gray-900 tracking-tighter">404</h1>
      <p className="text-gray-500 font-medium">Kechirasiz, siz qidirayotgan sahifa topilmadi.</p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-md transition-all"
      >
        <Home className="w-4 h-4" /> Bosh sahifaga qaytish
      </Link>
    </div>
  );
};

