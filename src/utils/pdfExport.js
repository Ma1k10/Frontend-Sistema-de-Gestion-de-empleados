// Utilidad para generar y descargar PDFs de horarios usando jsPDF y el plugin autotable.
// Permite exportar reportes de horarios (todos o por empleado) en formato PDF desde el navegador.

import jsPDF from 'jspdf'; // Librería principal para crear documentos PDF
import 'jspdf-autotable'; // Plugin que añade la funcionalidad de generar tablas dentro del PDF

// Función que genera un PDF con los horarios recibidos y lo descarga automáticamente.
// - schedules: array de registros de horarios a exportar
// - title: título del reporte (por defecto "Reporte de Horarios")
// - filters: objeto con los filtros aplicados para mostrarlos en el encabezado
// Retorna el nombre del archivo generado.
export const exportSchedulesToPDF = (schedules, title = 'Reporte de Horarios', filters = {}) => {
  // Se crea una nueva instancia del documento PDF con el tamaño de página por defecto (A4).
  const doc = new jsPDF();
  
  // Configuración de fuentes
  doc.setFont('helvetica');
  
  // Título
  doc.setFontSize(18);
  doc.text(title, 14, 15);
  
  // Fecha de generación
  doc.setFontSize(10);
  doc.text(`Generado: ${new Date().toLocaleString('es-ES')}`, 14, 25);
  
  // Filtros aplicados
  let yPos = 35; // Posición vertical actual en la página (en milímetros) donde se dibujará el contenido
  // Solo se dibuja la sección de filtros si existe al menos un filtro en el objeto
  if (Object.keys(filters).length > 0) {
    doc.setFontSize(12);
    doc.text('Filtros aplicados:', 14, yPos);
    yPos += 7;
    
    // Se imprimen únicamente los filtros que tengan valor, avanzando la posición vertical en cada uno
    doc.setFontSize(10);
    if (filters.id_empleado) {
      doc.text(`Empleado ID: ${filters.id_empleado}`, 20, yPos);
      yPos += 5;
    }
    if (filters.fecha_inicio) {
      doc.text(`Desde: ${filters.fecha_inicio}`, 20, yPos);
      yPos += 5;
    }
    if (filters.fecha_fin) {
      doc.text(`Hasta: ${filters.fecha_fin}`, 20, yPos);
      yPos += 5;
    }
    yPos += 5;
  }
  
  // Preparar datos para la tabla
  // Se transforma cada horario en un arreglo de columnas para la tabla del PDF.
  // Se usa optional chaining para evitar errores si el empleado o su usuario no existen.
  const tableData = schedules.map(schedule => {
    const empleado = schedule.empleado?.usuario?.nombre || 'N/A';
    const correo = schedule.empleado?.usuario?.correo || 'N/A';
    
    return [
      schedule.id || 'N/A',
      empleado,
      correo,
      schedule.fecha || 'N/A',
      `${schedule.hora_inicio || 'N/A'} - ${schedule.hora_fin || 'N/A'}`,
      schedule.estado || 'N/A'
    ];
  });
  
  // Configurar tabla
  // Definición de los encabezados de columnas que aparecerán en la tabla del PDF
  const tableColumns = [
    'ID',
    'Empleado',
    'Correo',
    'Fecha',
    'Horario',
    'Estado'
  ];
  
  // Generar tabla
  // Se dibuja la tabla con autoTable: encabezado azul, filas alternadas y fuente pequeña para que quepa en la página.
  doc.autoTable({
    head: [tableColumns],
    body: tableData,
    startY: yPos,
    theme: 'grid',
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [66, 139, 202],
      textColor: 255,
      fontSize: 10,
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    },
    margin: { top: yPos }
  });
  
  // Resumen
  // Se toma la posición final de la tabla para colocar debajo el total de registros generados
  const finalY = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(12);
  doc.text(`Total de registros: ${schedules.length}`, 14, finalY);
  
  // Guardar PDF
  const fileName = `horarios_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
  
  return fileName;
};

// Versión especializada de la exportación para los horarios de un solo empleado.
// Recibe el objeto empleado, sus horarios y los filtros; genera el PDF reutilizando la función general.
export const exportEmployeeSchedulesToPDF = (employee, schedules, filters = {}) => {
  // Se arma el título del reporte con el nombre del empleado (o 'Empleado' si no existe)
  const title = `Horarios - ${employee.usuario?.nombre || 'Empleado'}`;
  return exportSchedulesToPDF(schedules, title, filters);
};
