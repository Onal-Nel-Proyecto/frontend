import { useEffect, useState } from 'react';
import { FiPlus } from 'react-icons/fi';
import { useAuth } from '../../features/auth/hooks/usuAuth.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import ProveedorForm from '../../components/ModalRegistrarProveedor/ProveedorForm.jsx';
import TablaProveedores from '../../features/proveedores/components/tablaProveedores/TablaProveedores.jsx';
import { getProveedores, deleteProveedor } from '../../features/proveedores/services/proveedor.services.js';

import styles from '../GestionUsuarios/gestion-usuarios.module.css';

const GestionProveedores = () => {
	useDocumentTitle('Gestión de Proveedores');

	const { user } = useAuth();

	const isAdmin = user?.rol === 'ADMINISTRADOR';

	const [proveedores, setProveedores] = useState([]);
	const [showForm, setShowForm] = useState(false);
	const [proveedorSeleccionado, setProveedorSeleccionado] = useState(null);

	// Mostrar aviso temporal al cargar la página
	const [showWarning, setShowWarning] = useState(true);

	useEffect(() => {
		const timer = setTimeout(() => setShowWarning(false), 50000); // 50 segundos
		return () => clearTimeout(timer);
	}, []);

	const loadProveedores = async () => {
		try {
			const data = await getProveedores();
			// backend returns { meta, data } or array
			setProveedores(Array.isArray(data) ? data : data?.data ?? data);
		} catch (error) {
			console.error(error);
		}
	};

	useEffect(() => {
		loadProveedores();
	}, []);

	const openCreate = () => {
		setProveedorSeleccionado(null);
		setShowForm(true);
	};

	const openEdit = (prov) => {
		setProveedorSeleccionado(prov);
		setShowForm(true);
	};

	const closeForm = () => {
		setShowForm(false);
		setProveedorSeleccionado(null);
	};

	const handleDelete = async (prov) => {
		if (!prov) return;
		const confirmed = window.confirm(`¿Deshabilitar al proveedor ${prov.prov_nombre}?`);
		if (!confirmed) return;
		try {
			await deleteProveedor(prov.prov_id);
			setProveedores((prev) => prev.filter((p) => p.prov_id !== prov.prov_id));
		} catch (error) {
			console.error(error);
			alert('No se pudo deshabilitar el proveedor.');
		}
	};

	if (!user) {
		return (
			<div className={styles.page}>
				<div className={styles.header}>
					<h2 className={styles.title}>Gestión de Proveedores</h2>
					<p className={styles.subtitle}>Validando permisos...</p>
				</div>
			</div>
		);
	}

	return (
		<div className={styles.page}>
			<div className={styles.header}>
				<div>
					<h2 className={styles.title}>Gestión de Proveedores</h2>
				</div>

				<button className={styles.createButton} onClick={openCreate}>
					<FiPlus />
					Registrar proveedor
				</button>
			</div>

			{/** Aviso temporal: se oculta automáticamente después de 50 segundos */}
			{showWarning && (
				<div className={styles.warningBox}>
					Todos los usuarios pueden crear, editar y deshabilitar proveedores en esta página.
				</div>
			)}

			<TablaProveedores proveedores={proveedores} isAdmin={isAdmin} openEdit={openEdit} handleDelete={handleDelete} />

			<div className={styles.note}>Conectado al backend correctamente.</div>

			<ProveedorForm isOpen={showForm} onClose={closeForm} proveedor={proveedorSeleccionado} onSuccess={loadProveedores} />
		</div>
	);
};

export default GestionProveedores;
