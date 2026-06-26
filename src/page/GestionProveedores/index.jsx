import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FiPlus, FiArrowLeft } from 'react-icons/fi';
import { FaHandshakeAngle } from "react-icons/fa6";
import { useAuth } from '../../features/auth/hooks/usuAuth.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import ProveedorForm from '../../components/ModalRegistrarProveedor/ProveedorForm.jsx';
import TablaProveedores from '../../features/proveedores/components/tablaProveedores/TablaProveedores.jsx';
import { getProveedores, deleteProveedor } from '../../features/proveedores/services/proveedor.services.js';

import styles from '../GestionProveedores/gestion-proveedores.module.css';



const GestionProveedores = () => {
	useDocumentTitle('Gestión de Proveedores');

	const navigate = useNavigate();

	const { user } = useAuth();

	const isAdmin = user?.rol === 'ADMINISTRADOR';
    const [searchParams, setSearchParams] = useSearchParams();
	const [proveedores, setProveedores] = useState([]);
	const [showForm, setShowForm] = useState(false);
	const [proveedorSeleccionado, setProveedorSeleccionado] = useState(null);
	const [search, setSearch] = useState(
	() => searchParams.get('search') || ''
);

	const [filters, setFilters] = useState(() => ({
		estado: searchParams.get('estado') || '',
		suministro: searchParams.get('suministro') || '',
		tipoDocumento: searchParams.get('tipoDocumento') || '',
	}));
	const [loading, setLoading] = useState(false);
	

	const loadProveedores = useCallback(async ({ nombre, suministro, estado, tipoDocumento } = {}) => {
	setLoading(true);

	try {
		const params = {};

		const filtroNombre =
			nombre !== undefined ? nombre : search;

		const filtroSuministro =
			suministro !== undefined
				? suministro
				: filters.suministro;

		const filtroEstado =
			estado !== undefined
				? estado
				: filters.estado;

		const filtroTipoDocumento =
			tipoDocumento !== undefined
				? tipoDocumento
				: filters.tipoDocumento;		

		if (filtroNombre)
			params.prov_nombre = filtroNombre;

		if (filtroSuministro)
			params.prov_tipo_suministro = filtroSuministro;

		if (filtroEstado)
			params.estado = filtroEstado;

		const data = await getProveedores(params);

		console.log('DATA API:', data);

		const resultado = Array.isArray(data) ? data : data?.data ?? data;

		console.log('SET PROVEEDORES:', resultado);

		setProveedores(resultado);

	} catch (error) {
		console.error(error);
	} finally {
		setLoading(false);
	}
}, [search, filters]);

useEffect(() => {
	const params = {};

	if (search) params.search = search;
	if (filters.estado) params.estado = filters.estado;
	if (filters.suministro) params.suministro = filters.suministro;
	if (filters.tipoDocumento) params.tipoDocumento = filters.tipoDocumento;

	setSearchParams(params, {
		replace: true,
	});
}, [search, filters, setSearchParams]);

useEffect(() => {
	loadProveedores({
		nombre: search,
		suministro: filters.suministro,
		estado: filters.estado,
		tipoDocumento: filters.tipoDocumento,
	});
}, [search, filters.suministro, filters.estado, filters.tipoDocumento, loadProveedores]);

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
				<div className={styles.headerLeft}>
					<button
						className={styles.backButton}
						onClick={() => navigate(-1)}
					>
						<FiArrowLeft />
					</button>

					<h2 className={styles.title}>
						<FaHandshakeAngle className={styles.titleIcon} />
						Gestión de Proveedores
					</h2>
					</div>
				<button className={styles.createButton} onClick={openCreate}>
					<FiPlus />
					Registrar proveedor
				</button>
			</div>

			<TablaProveedores
				proveedores={proveedores}
				search={search}
				onSearchChange={setSearch}
				filters={filters}
				setFilters={setFilters}
				isAdmin={isAdmin}
				openEdit={openEdit}
				handleDelete={handleDelete}
				loading={loading}
			/>

			<div className={styles.note}>Conectado al backend correctamente.</div>

			<ProveedorForm
				isOpen={showForm}
				onClose={closeForm}
				proveedor={proveedorSeleccionado}
				onSuccess={() => loadProveedores({ nombre: search, suministro: filters.suministro, estado: filters.estado, tipoDocumento: filters.tipoDocumento,  })}
			/>
		</div>
	);
};

export default GestionProveedores;
