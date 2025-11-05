import React, { useEffect, useState } from "react";
import { FiPlus, FiEdit2, FiTrash2 } from "react-icons/fi";
import ProductoFormModal from "../components/ProductoFormModal";
import "../index.css";

export default function MercaderiaPage() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const API_URL = "http://localhost:8080/api/productos";

  const fetchProductos = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      setProductos(data);
    } catch (err) {
      console.error("Error cargando productos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductos();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("¿Seguro que quieres eliminar este producto?")) return;
    await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    fetchProductos();
  };

  const handleSave = async (producto) => {
    const method = producto.id ? "PUT" : "POST";
    const url = producto.id ? `${API_URL}/${producto.id}` : API_URL;

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(producto),
    });

    setModalOpen(false);
    setEditing(null);
    fetchProductos();
  };

  return (
    <div className="home-main">
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24}}>
        <div>
          <h1 style={{fontSize:28, margin:0}}>Gestión de Mercadería</h1>
          <p style={{margin:4, color:'var(--muted)'}}>CRUD de productos y control de stock</p>
        </div>
        <div>
          <button
            onClick={() => { setEditing(null); setModalOpen(true); }}
            className="btn btn-primary"
          >
            <FiPlus /> &nbsp; Nuevo producto
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500">Cargando productos...</p>
      ) : productos.length === 0 ? (
        <p className="text-gray-500">No hay productos registrados.</p>
      ) : (
        <div className="table-card">
          <table className="custom-table">
            <thead>
              <tr>
                <th>SKU o ID</th>
                <th>Nombre</th>
                <th>Stock</th>
                <th>Precio Venta</th>
                <th>Unidad</th>
                <th style={{textAlign:'right'}}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {productos.map((p) => (
                <tr key={p.id}>
                  <td>{p.sku || p.id}</td>
                  <td>{p.nombre}</td>
                  <td>{p.stock}</td>
                  <td>${p.precioVenta}</td>
                  <td>{p.unidadMedida}</td>
                  <td style={{textAlign:'right'}}>
                    <button
                      onClick={() => { setEditing(p); setModalOpen(true); }}
                      className="icon-btn"
                      title="Editar"
                    >
                      <FiEdit2 />
                    </button>
                    &nbsp;
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="icon-btn"
                      title="Eliminar"
                    >
                      <FiTrash2 />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <ProductoFormModal
          producto={editing}
          onClose={() => { setModalOpen(false); setEditing(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
