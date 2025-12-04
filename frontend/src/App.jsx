// App.js
import { useState } from 'react';
import Uploader from './components/Uploader';
import FileGallery from './components/FileGallery';

function App() {
    const [refreshKey, setRefreshKey] = useState(0);

    const triggerRefresh = () => {
        setRefreshKey(prev => prev + 1);
    };

    // Aplicar modo oscuro al cargar
    useState(() => {
        document.documentElement.classList.add('dark');
        document.body.classList.add('bg-gray-900');
    });

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100">
            {/* Header */}
            <header className="bg-gray-800 shadow-lg border-b border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div className="flex items-center">
                            <div className="bg-blue-700 rounded-lg p-3 mr-4">
                                <i className="fas fa-cloud-upload-alt text-white text-2xl"></i>
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-white">Mi Servidor de Archivos</h1>
                                <p className="text-gray-300">
                                    <i className="fas fa-shield-alt text-green-400 mr-1"></i>
                                    Almacena y gestiona tus archivos de forma segura
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-sm text-gray-400">
                                <i className="fas fa-server mr-1"></i>
                                Servidor local
                            </div>
                            <div className="text-green-400 font-medium">
                                <i className="fas fa-circle text-green-500 mr-1"></i>
                                En línea
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Uploader onUploadSuccess={triggerRefresh} />
                <FileGallery key={refreshKey} />
            </main>

            {/* Footer */}
            <footer className="bg-gray-800 border-t border-gray-700 mt-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="text-center text-gray-400 text-sm">
                        <p>
                            <i className="fas fa-code mr-1"></i>
                            Servidor de archivos casero • Desarrollado con React + Node.js
                        </p>
                        <p className="mt-1">
                            <i className="fas fa-database mr-1"></i>
                            Almacenamiento local • {new Date().getFullYear()}
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default App;