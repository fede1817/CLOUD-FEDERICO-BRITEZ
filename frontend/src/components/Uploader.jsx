// Uploader.js
import { useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

const Uploader = ({ onUploadSuccess }) => {  // Agregar prop
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);

    const handleFileChange = (e) => {
        setFiles(Array.from(e.target.files));
    };

    const showSuccessAlert = (fileCount) => {
        Swal.fire({
            title: '¡Éxito!',
            text: `${fileCount} archivo${fileCount !== 1 ? 's' : ''} subido${fileCount !== 1 ? 's' : ''} correctamente`,
            icon: 'success',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#3b82f6',
            timer: 3000,
            timerProgressBar: true
        });
    };

    const showErrorAlert = (message) => {
        Swal.fire({
            title: 'Error',
            text: message || 'Error subiendo archivos',
            icon: 'error',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#ef4444'
        });
    };

    const showWarningAlert = () => {
        Swal.fire({
            title: 'Sin archivos',
            text: 'Por favor selecciona al menos un archivo para subir',
            icon: 'warning',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#f59e0b'
        });
    };

    const handleUpload = async () => {
        if (files.length === 0) {
            showWarningAlert();
            return;
        }

        setUploading(true);
        
        Swal.fire({
            title: 'Subiendo archivos...',
            text: `Procesando ${files.length} archivo${files.length !== 1 ? 's' : ''}`,
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        const formData = new FormData();
        
        files.forEach(file => {
            formData.append('files', file);
        });

        try {
            const uploadedCount = files.length;
            await axios.post('http://localhost:5000/api/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                timeout: 60000
            });
            
            setFiles([]);
            Swal.close();
            showSuccessAlert(uploadedCount);
            
            // Llamar a la función callback para actualizar la galería
            if (onUploadSuccess) {
                onUploadSuccess();
            }
            
        } catch (error) {
            console.error('Error subiendo archivos:', error);
            Swal.close();
            
            if (error.code === 'ECONNABORTED') {
                showErrorAlert('El servidor tardó demasiado en responder. Intenta nuevamente.');
            } else if (error.response?.data?.error) {
                showErrorAlert(error.response.data.error);
            } else {
                showErrorAlert('Error de conexión con el servidor');
            }
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
                <i className="fas fa-upload mr-2 text-blue-600"></i>
                Subir Archivos
            </h2>
            
            <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition duration-200">
                    <i className="fas fa-cloud-upload-alt text-4xl text-gray-400 mb-2"></i>
                    <p className="text-gray-600 mb-2">Arrastra tus archivos aquí o haz clic para seleccionar</p>
                    <input 
                        type="file" 
                        multiple 
                        onChange={handleFileChange}
                        disabled={uploading}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                </div>
                
                <button 
                    onClick={handleUpload} 
                    disabled={uploading || files.length === 0}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center"
                >
                    {uploading ? (
                        <>
                            <i className="fas fa-spinner fa-spin mr-2"></i>
                            Subiendo...
                        </>
                    ) : (
                        <>
                            <i className="fas fa-paper-plane mr-2"></i>
                            Subir {files.length} archivo{files.length !== 1 ? 's' : ''}
                        </>
                    )}
                </button>
                
                {files.length > 0 && (
                    <div className="border-t pt-4">
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">
                            <i className="fas fa-file-alt mr-2 text-green-600"></i>
                            Archivos seleccionados:
                        </h3>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                            {files.map((file, index) => (
                                <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                                    <div className="flex items-center flex-1">
                                        <i className="fas fa-file text-gray-400 mr-3"></i>
                                        <span className="text-sm text-gray-600 truncate">{file.name}</span>
                                    </div>
                                    <span className="text-xs text-gray-500 ml-2">
                                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Uploader;