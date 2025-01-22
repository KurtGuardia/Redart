import React from 'react';
import Link from 'next/link';

const Footer = () => {
    return (
        <footer className="bg-[#09090B] text-gray-300 py-8 mx-12 rounded-t-[40px]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Company Info */}
                    <div>
                        <h3 className="text-xl font-bold text-accent mb-4">Redarte</h3>
                        <p className="text-sm">
                            Conectando artistas y amantes del arte en toda la región
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="text-lg font-semibold mb-4">Enlaces Rápidos</h4>
                        <ul className="space-y-2">
                            <li>
                                <Link href="#" className="hover:text-accent transition-colors">
                                    Eventos
                                </Link>
                            </li>
                            <li>
                                <Link href="#" className="hover:text-accent transition-colors">
                                    Artistas
                                </Link>
                            </li>
                            <li>
                                <Link href="#" className="hover:text-accent transition-colors">
                                    Galerías
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 className="text-lg font-semibold mb-4">Contacto</h4>
                        <ul className="space-y-2">
                            <li>Email: info@redarte.com</li>
                            <li>Tel: +123 456 789</li>
                            <li>Cochabamba, Bolivia</li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-gray-700 mt-8 pt-6 text-sm text-center">
                    <p>&copy; {new Date().getFullYear()} Developed by Kurt</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
