import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LocationProvider } from './context/LocationContext';
import { ProductsProvider } from './context/ProductsContext';
import { CartProvider } from './context/CartContext';
import AppRoutes from './routes/AppRoutes';
import Navigation from './components/Navigation';
import Footer from './components/Footer';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LocationProvider>
          <ProductsProvider>
            <CartProvider>
              <div className="flex flex-col min-h-screen bg-background text-dark">
                {/* Premium Navigation Header */}
                <Navigation />
                
                {/* Main Content Area */}
                <main className="flex-grow">
                  <AppRoutes />
                </main>
                
                {/* Clean Trust-focused Footer */}
                <Footer />
              </div>
            </CartProvider>
          </ProductsProvider>
        </LocationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
