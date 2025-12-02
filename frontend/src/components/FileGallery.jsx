import { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

const FileGallery = ({ refreshKey }) => { // Recibir refreshKey como prop
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [isSelecting, setIsSelecting] = useState(false);

    const fetchFiles = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/files');
            console.log('Respuesta del servidor:', response.data);
            const filesData = response.data.data?.files || response.data.files || response.data || [];
            setFiles(Array.isArray(filesData) ? filesData : []);
            // Limpiar selección al actualizar
            setSelectedFiles([]);
        } catch (error) {
            console.error('Error cargando archivos:', error);
            showErrorAlert('Error cargando los archivos');
        } finally {
            setLoading(false);
        }
    };

    const showSuccessAlert = (message) => {
        Swal.fire({
            title: '¡Éxito!',
            text: message,
            icon: 'success',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#10b981',
            timer: 2000,
            timerProgressBar: true
        });
    };

    const showErrorAlert = (message) => {
        Swal.fire({
            title: 'Error',
            text: message,
            icon: 'error',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#ef4444'
        });
    };

    // Función para seleccionar/deseleccionar un archivo
    const toggleFileSelection = (filename) => {
        if (selectedFiles.includes(filename)) {
            setSelectedFiles(selectedFiles.filter(f => f !== filename));
        } else {
            setSelectedFiles([...selectedFiles, filename]);
        }
    };

    // Función para seleccionar todos los archivos visibles
    const selectAllVisible = () => {
        const visibleFilenames = filteredFiles.map(f => f.name);
        if (selectedFiles.length === visibleFilenames.length) {
            // Si todos están seleccionados, deseleccionar todos
            setSelectedFiles([]);
        } else {
            // Seleccionar todos los visibles
            setSelectedFiles(visibleFilenames);
        }
    };

    // Eliminar archivo individual
    const deleteFile = async (filename) => {
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            html: `
                <div class="text-center">
                    <i class="fas fa-exclamation-triangle text-4xl text-yellow-500 mb-4"></i>
                    <p>Vas a eliminar el archivo: <strong>${filename}</strong></p>
                    <p class="text-sm text-gray-500 mt-2">Esta acción no se puede deshacer</p>
                </div>
            `,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            reverseButtons: true,
            focusCancel: true
        });

        if (result.isConfirmed) {
            try {
                Swal.fire({
                    title: 'Eliminando...',
                    text: 'Por favor espera',
                    allowOutsideClick: false,
                    didOpen: () => {
                        Swal.showLoading();
                    }
                });

                await axios.delete(`http://localhost:5000/api/files/${filename}`);
                
                Swal.close();
                showSuccessAlert('Archivo eliminado correctamente');
                fetchFiles(); // Actualizar la lista después de eliminar
                
            } catch (error) {
                console.error('Error eliminando archivo:', error);
                Swal.close();
                showErrorAlert('Error eliminando el archivo');
            }
        }
    };

    // Eliminación masiva de archivos
    const deleteSelectedFiles = async () => {
        if (selectedFiles.length === 0) {
            showErrorAlert('No hay archivos seleccionados');
            return;
        }

        const result = await Swal.fire({
            title: '¿Eliminar archivos seleccionados?',
            html: `
                <div class="text-center">
                    <i class="fas fa-exclamation-triangle text-4xl text-yellow-500 mb-4"></i>
                    <p>Vas a eliminar <strong>${selectedFiles.length} archivo(s)</strong></p>
                    <div class="mt-4 max-h-40 overflow-y-auto">
                        <ul class="text-left text-sm">
                            ${selectedFiles.slice(0, 10).map(file => 
                                `<li class="truncate">• ${file}</li>`
                            ).join('')}
                            ${selectedFiles.length > 10 ? 
                                `<li class="text-gray-500">... y ${selectedFiles.length - 10} más</li>` : 
                                ''
                            }
                        </ul>
                    </div>
                    <p class="text-sm text-red-500 mt-4 font-bold">⚠️ Esta acción no se puede deshacer</p>
                </div>
            `,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: `Sí, eliminar (${selectedFiles.length})`,
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            reverseButtons: true,
            focusCancel: true,
            width: '500px'
        });

        if (result.isConfirmed) {
            try {
                Swal.fire({
                    title: 'Eliminando...',
                    html: `Eliminando ${selectedFiles.length} archivo(s)<br/>
                           <small>Esto puede tomar unos momentos</small>`,
                    allowOutsideClick: false,
                    didOpen: () => {
                        Swal.showLoading();
                    }
                });

                const response = await axios.delete('http://localhost:5000/api/files/batch', {
                    data: { filenames: selectedFiles }
                });

                Swal.close();
                
                if (response.data.success) {
                    showSuccessAlert(`Eliminados ${response.data.data.success.length} de ${selectedFiles.length} archivos`);
                    // Actualizar la lista
                    fetchFiles();
                } else {
                    showErrorAlert('Error en la eliminación masiva');
                }
                
            } catch (error) {
                console.error('Error eliminando archivos:', error);
                Swal.close();
                showErrorAlert('Error eliminando los archivos');
            }
        }
    };

    // Mostrar información del archivo
    const showFileInfo = (file) => {
        Swal.fire({
            title: 'Información del Archivo',
            html: `
                <div class="text-left">
                    <div class="mb-3">
                        <label class="font-semibold text-gray-700">Nombre:</label>
                        <p class="text-gray-600 break-all">${file.originalName || file.name}</p>
                    </div>
                    <div class="mb-3">
                        <label class="font-semibold text-gray-700">Tamaño:</label>
                        <p class="text-gray-600">${file.sizeFormatted || formatFileSize(file.size)}</p>
                    </div>
                    <div class="mb-3">
                        <label class="font-semibold text-gray-700">Tipo:</label>
                        <p class="text-gray-600 capitalize">${file.type || 'Desconocido'}</p>
                    </div>
                    <div class="mb-3">
                        <label class="font-semibold text-gray-700">Extensión:</label>
                        <p class="text-gray-600">${file.extension || 'Ninguna'}</p>
                    </div>
                    <div class="mb-3">
                        <label class="font-semibold text-gray-700">Fecha de subida:</label>
                        <p class="text-gray-600">${new Date(file.uploadDate).toLocaleString()}</p>
                    </div>
                </div>
            `,
            icon: 'info',
            confirmButtonText: 'Cerrar',
            confirmButtonColor: '#3b82f6',
            width: '500px'
        });
    };

    // Efecto para cargar archivos inicialmente y cuando cambie refreshKey
    useEffect(() => {
        fetchFiles();
    }, [refreshKey]); // Agregar refreshKey como dependencia

    const formatFileSize = (bytes) => {
        if (!bytes || bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const filteredFiles = filter === 'all' 
        ? files 
        : files.filter(file => file.type === filter);

    // Calcular conteos de archivos por tipo
    const fileTypeCounts = {
        all: files.length,
        image: files.filter(f => f.type === 'image').length,
        video: files.filter(f => f.type === 'video').length,
        audio: files.filter(f => f.type === 'audio').length,
        document: files.filter(f => f.type === 'document').length,
        archive: files.filter(f => f.type === 'archive').length,
        code: files.filter(f => f.type === 'code').length,
        executable: files.filter(f => f.type === 'executable').length,
        other: files.filter(f => !f.type || f.type === 'other').length,
    };

    const getTypeIcon = (type) => {
        if (!type) return 'far fa-file';
        
        switch (type) {
            case 'image': return 'far fa-file-image';
            case 'video': return 'far fa-file-video';
            case 'audio': return 'far fa-file-audio';
            case 'document': return 'far fa-file-alt';
            case 'archive': return 'far fa-file-archive';
            case 'code': return 'far fa-file-code';
            case 'executable': return 'fas fa-cog';
            case 'font': return 'fas fa-font';
            case 'database': return 'fas fa-database';
            default: return 'far fa-file';
        }
    };

    const getTypeColor = (type) => {
        if (!type) return 'text-gray-400';
        
        switch (type) {
            case 'image': return 'text-green-500';
            case 'video': return 'text-red-500';
            case 'audio': return 'text-purple-500';
            case 'document': return 'text-blue-500';
            case 'archive': return 'text-yellow-500';
            case 'code': return 'text-indigo-500';
            case 'executable': return 'text-gray-500';
            case 'font': return 'text-pink-500';
            case 'database': return 'text-teal-500';
            default: return 'text-gray-400';
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <i className="fas fa-spinner fa-spin text-4xl text-blue-600"></i>
                <span className="ml-3 text-gray-600">Cargando archivos...</span>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            {/* Encabezado con botones */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                    <i className="fas fa-folder-open mr-2 text-blue-600"></i>
                    Archivos Subidos
                    <span className="ml-2 bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded">
                        {files.length}
                    </span>
                </h2>
                
                <div className="flex space-x-2">
                    {/* Botones de selección masiva */}
                    {isSelecting ? (
                        <>
                            <button 
                                onClick={selectAllVisible}
                                className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200 flex items-center"
                            >
                                <i className={`fas fa-${selectedFiles.length === filteredFiles.length ? 'minus' : 'check'}-square mr-2`}></i>
                                {selectedFiles.length === filteredFiles.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                            </button>
                            
                            {selectedFiles.length > 0 && (
                                <button 
                                    onClick={deleteSelectedFiles}
                                    className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200 flex items-center"
                                >
                                    <i className="fas fa-trash mr-2"></i>
                                    Eliminar ({selectedFiles.length})
                                </button>
                            )}
                            
                            <button 
                                onClick={() => {
                                    setIsSelecting(false);
                                    setSelectedFiles([]);
                                }}
                                className="bg-gray-400 hover:bg-gray-500 text-white font-medium py-2 px-4 rounded-lg transition duration-200 flex items-center"
                            >
                                <i className="fas fa-times mr-2"></i>
                                Cancelar
                            </button>
                        </>
                    ) : (
                        <>
                            <button 
                                onClick={() => setIsSelecting(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200 flex items-center"
                            >
                                <i className="fas fa-check-square mr-2"></i>
                                Seleccionar múltiple
                            </button>
                            
                            <button 
                                onClick={fetchFiles}
                                className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200 flex items-center"
                            >
                                <i className="fas fa-sync-alt mr-2"></i>
                                Actualizar
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Indicador de selección */}
            {isSelecting && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <i className="fas fa-check-circle text-blue-600 mr-2"></i>
                            <span className="text-blue-800 font-medium">
                                {selectedFiles.length} archivo(s) seleccionado(s)
                            </span>
                        </div>
                        <div className="text-sm text-blue-600">
                            Haz clic en los archivos para seleccionar/deseleccionar
                        </div>
                    </div>
                </div>
            )}

            {/* Filtros por tipo */}
            <div className="mb-6">
                <div className="flex flex-wrap gap-2">
                    {[
                        { key: 'all', label: 'Todos', icon: 'fas fa-layer-group' },
                        { key: 'image', label: 'Imágenes', icon: 'far fa-file-image' },
                        { key: 'video', label: 'Videos', icon: 'far fa-file-video' },
                        { key: 'audio', label: 'Audio', icon: 'far fa-file-audio' },
                        { key: 'document', label: 'Documentos', icon: 'far fa-file-alt' },
                        { key: 'archive', label: 'Archivos', icon: 'far fa-file-archive' },
                        { key: 'code', label: 'Código', icon: 'far fa-file-code' },
                        { key: 'executable', label: 'Programas', icon: 'fas fa-cog' },
                        { key: 'other', label: 'Otros', icon: 'far fa-file' }
                    ].map(({ key, label, icon }) => (
                        <button
                            key={key}
                            onClick={() => {
                                setFilter(key);
                                // Limpiar selección al cambiar filtro
                                if (isSelecting) {
                                    setSelectedFiles([]);
                                }
                            }}
                            className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition duration-200 ${
                                filter === key
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            <i className={`${icon} mr-2`}></i>
                            {label}
                            <span className="ml-2 bg-black bg-opacity-20 px-1.5 py-0.5 rounded text-xs">
                                {fileTypeCounts[key] || 0}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
            
            {filteredFiles.length === 0 ? (
                <div className="text-center py-12">
                    <i className="fas fa-folder-open text-6xl text-gray-400 mb-4"></i>
                    <p className="text-gray-500 text-lg">
                        {filter === 'all' 
                            ? 'No hay archivos subidos aún.' 
                            : `No hay archivos de tipo ${filter}`
                        }
                    </p>
                    <p className="text-gray-400">
                        {filter === 'all' 
                            ? 'Sube algunos archivos usando el formulario de arriba.' 
                            : 'Cambia el filtro o sube archivos de este tipo.'
                        }
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {filteredFiles.map((file, index) => (
                        <div 
                            key={index} 
                            className={`border rounded-lg overflow-hidden hover:shadow-lg transition duration-200 relative ${
                                isSelecting && selectedFiles.includes(file.name)
                                    ? 'border-blue-500 border-2 bg-blue-50'
                                    : 'border-gray-200'
                            }`}
                            onClick={() => {
                                if (isSelecting) {
                                    toggleFileSelection(file.name);
                                }
                            }}
                        >
                            {/* Checkbox de selección */}
                            {isSelecting && (
                                <div className="absolute top-2 left-2 z-10">
                                    <div className={`w-6 h-6 rounded flex items-center justify-center ${
                                        selectedFiles.includes(file.name)
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-white text-gray-400 border border-gray-300'
                                    }`}>
                                        <i className={`fas fa-${selectedFiles.includes(file.name) ? 'check' : 'plus'} text-xs`}></i>
                                    </div>
                                </div>
                            )}
                            
                            {/* Preview del archivo */}
                            <div className="h-32 bg-gray-100 flex items-center justify-center overflow-hidden relative">
                                {file.type === 'image' ? (
                                    <img 
                                        src={file.url} 
                                        alt={file.originalName || file.name}
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'flex';
                                        }}
                                    />
                                ) : null}
                                <div className={`text-5xl ${file.type === 'image' ? 'hidden' : 'flex'}`}>
                                    <i className={`${getTypeIcon(file.type)} ${getTypeColor(file.type)}`}></i>
                                </div>
                                
                                {/* Overlay para indicar selección */}
                                {isSelecting && selectedFiles.includes(file.name) && (
                                    <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center">
                                        <i className="fas fa-check-circle text-blue-600 text-3xl"></i>
                                    </div>
                                )}
                            </div>
                            
                            {/* Información del archivo */}
                            <div className="p-3">
                                <p 
                                    className="text-sm font-medium text-gray-800 truncate mb-1 cursor-pointer hover:text-blue-600" 
                                    title={file.originalName || file.name}
                                    onClick={(e) => {
                                        if (!isSelecting) {
                                            e.stopPropagation();
                                            showFileInfo(file);
                                        }
                                    }}
                                >
                                    {file.originalName || file.name}
                                </p>
                                <div className="flex justify-between items-center text-xs text-gray-500 mb-2">
                                    <span>
                                        <i className="fas fa-hdd mr-1"></i>
                                        {file.sizeFormatted || formatFileSize(file.size)}
                                    </span>
                                    <span>
                                        <i className="far fa-calendar mr-1"></i>
                                        {new Date(file.uploadDate).toLocaleDateString()}
                                    </span>
                                </div>
                                
                                {/* Acciones (solo si no estamos en modo selección) */}
                                {!isSelecting && (
                                    <div className="flex space-x-2">
                                        <a 
                                            href={file.url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-center py-1 px-2 rounded text-sm transition duration-200 flex items-center justify-center"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <i className="fas fa-download mr-1"></i>
                                            ver
                                        </a>
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteFile(file.name);
                                            }}
                                            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-1 px-2 rounded text-sm transition duration-200 flex items-center justify-center"
                                        >
                                            <i className="fas fa-trash mr-1"></i>
                                            Eliminar
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FileGallery;