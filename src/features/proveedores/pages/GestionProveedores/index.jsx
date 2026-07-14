import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FiPlus, FiArrowLeft } from 'react-icons/fi';
import { FaHandshakeAngle } from "react-icons/fa6";
import { useAuth } from '../../../auth/hooks/usuAuth.js';
import { useDocumentTitle } from '../../../../hooks/useDocumentTitle.js';
import ProveedorForm from '../../../usuarios/components/ModalRegistrarProveedor/ProveedorForm.jsx';
import TablaProveedores from '../../components/tablaProveedores/TablaProveedores.jsx';
import { getProveedores, deleteProveedor } from '../../services/proveedor.services.js';

import styles from './gestion-proveedores.module.css';



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

	const [pagina, setPagina] = useState(
			() => Number(searchParams.get('pagina')) || 1
			);
	const [totalPaginas, setTotalPaginas] = useState(1);

	const loadProveedores = useCallback(async ({
		nombre,
		suministro,
		estado,
		tipoDocumento,
		pagina = 1,
	} = {}) => {
	setLoading(true);

	try {
		const params = {};
		params.pagina = pagina;
		params.limite = 15;

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
			params.prov_tipo_suministro = filtroSuministro.trim();

		if (filtroEstado)
			params.estado = filtroEstado;

		const respuesta = await getProveedores(params);

			console.log("DATA API:", respuesta);

			setProveedores(respuesta.data || []);
			setTotalPaginas(respuesta.meta?.paginas_totales || 1);

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
	if (pagina > 1) params.pagina = pagina;

	setSearchParams(params, {
		replace: true,
	});
}, [search, filters, pagina, setSearchParams]);

useEffect(() => {
	loadProveedores({
		nombre: search,
		suministro: filters.suministro,
		estado: filters.estado,
		tipoDocumento: filters.tipoDocumento,
		pagina: pagina,
	});
}, [
	search,
	filters.suministro,
	filters.estado,
	filters.tipoDocumento,
	pagina,
	loadProveedores,
]);

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
					  <div className={styles.titleIcon}>
						<FaHandshakeAngle />
					</div>

					<div className={styles.titleContainer}>
						<h2 className={styles.title}>
						Gestión de Proveedores
						</h2>

						<p className={styles.subtitle}>
						Administra los proveedores registrados en el sistema.
						</p>
					</div>
					</div>
				<button className={styles.createButton} onClick={openCreate}>
					<FiPlus />
					Registrar proveedor
				</button>
			</div>

			<TablaProveedores
				proveedores={proveedores}
				search={search}
				onSearchChange={(valor) => {
					setSearch(valor);
					setPagina(1);
				}}
				filters={filters}
								setFilters={(nuevoFiltro) => {
					setFilters(nuevoFiltro);
					setPagina(1);
				}}
				isAdmin={isAdmin}
				openEdit={openEdit}
				handleDelete={handleDelete}
				loading={loading}
			/>
			{totalPaginas > 1 && (
			<div className={styles.pagination}>
				<button
				className={styles.pageButton}
				onClick={() => setPagina((p) => Math.max(1, p - 1))}
				disabled={pagina === 1}
				>
				← Anterior
				</button>

				<span className={styles.pageInfo}>
				Página {pagina} de {totalPaginas}
				</span>

				<button
				className={styles.pageButton}
				onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
				disabled={pagina === totalPaginas}
				>
				Siguiente →
				</button>
			</div>
			)}
			

			<ProveedorForm
				isOpen={showForm}
				onClose={closeForm}
				proveedor={proveedorSeleccionado}
				onSuccess={() =>
    loadProveedores({
						nombre: search,
						suministro: filters.suministro,
						estado: filters.estado,
						tipoDocumento: filters.tipoDocumento,
						pagina,
					})
				}
			/>
		</div>
	);
};

export default GestionProveedores;
