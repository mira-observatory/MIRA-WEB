import type { Language } from "../../../i18n";

// Cada entrada tiene un ID permanente y sus dos traducciones. Las preguntas
// usan los paises activos de la consulta, sin fijar fechas ni prometer datos.
const groups = {
  health: [
    ["medicine-purchases", "Muéstrame compras de medicamentos.", "Show me medicine purchases."],
    [
      "medical-equipment",
      "¿Qué instituciones compraron equipo médico?",
      "Which institutions purchased medical equipment?",
    ],
    [
      "hospital-supplies",
      "Busca procedimientos de insumos hospitalarios.",
      "Find procurement procedures for hospital supplies.",
    ],
    [
      "ambulances",
      "Muéstrame las compras más recientes de ambulancias.",
      "Show me the most recent ambulance purchases.",
    ],
    [
      "laboratory-supplies",
      "¿Qué compras de materiales de laboratorio hay registradas?",
      "What laboratory supply purchases are recorded?",
    ],
    [
      "medicine-suppliers",
      "¿Qué proveedores tienen más adjudicaciones de medicamentos?",
      "Which suppliers have the most medicine awards?",
    ],
    [
      "hospital-maintenance",
      "Busca servicios de mantenimiento de hospitales.",
      "Find hospital maintenance services.",
    ],
    [
      "dental-equipment",
      "Muéstrame procedimientos de compra de equipo odontológico.",
      "Show me dental equipment procurement procedures.",
    ],
    [
      "vaccines",
      "¿Qué instituciones han publicado compras de vacunas?",
      "Which institutions have published vaccine purchases?",
    ],
    ["medical-oxygen", "Busca compras de oxígeno medicinal.", "Find medical oxygen purchases."],
  ],
  technology: [
    ["computers", "Muéstrame compras de computadoras.", "Show me computer purchases."],
    [
      "software-licenses",
      "¿Qué instituciones compraron licencias de software?",
      "Which institutions purchased software licenses?",
    ],
    [
      "printers",
      "Busca procedimientos de compra de impresoras.",
      "Find printer procurement procedures.",
    ],
    [
      "internet-services",
      "Muéstrame contrataciones de servicios de internet.",
      "Show me internet service procurement.",
    ],
    [
      "servers",
      "¿Qué compras de servidores hay registradas?",
      "What server purchases are recorded?",
    ],
    [
      "computer-maintenance",
      "Busca servicios de mantenimiento de computadoras.",
      "Find computer maintenance services.",
    ],
    [
      "network-equipment",
      "Muéstrame las compras más recientes de equipos de red.",
      "Show me the most recent network equipment purchases.",
    ],
    [
      "software-development",
      "¿Qué instituciones contrataron desarrollo de software?",
      "Which institutions procured software development services?",
    ],
    [
      "technology-suppliers",
      "¿Qué proveedores tienen más adjudicaciones de equipo de cómputo?",
      "Which suppliers have the most computer equipment awards?",
    ],
    [
      "cybersecurity",
      "Busca contrataciones relacionadas con ciberseguridad.",
      "Find procurement related to cybersecurity.",
    ],
  ],
  infrastructure: [
    [
      "road-construction",
      "Muéstrame procedimientos de construcción de carreteras.",
      "Show me road construction procurement procedures.",
    ],
    [
      "bridge-maintenance",
      "Busca contrataciones de mantenimiento de puentes.",
      "Find bridge maintenance procurement.",
    ],
    [
      "school-construction",
      "¿Qué instituciones publicaron obras de construcción de escuelas?",
      "Which institutions published school construction projects?",
    ],
    [
      "street-paving",
      "Muéstrame las obras más recientes de pavimentación.",
      "Show me the most recent paving projects.",
    ],
    [
      "water-networks",
      "Busca procedimientos de construcción de redes de agua potable.",
      "Find drinking water network construction procedures.",
    ],
    [
      "building-renovation",
      "Muéstrame contrataciones de remodelación de edificios públicos.",
      "Show me public building renovation procurement.",
    ],
    ["drainage", "¿Qué obras de drenaje hay registradas?", "What drainage projects are recorded?"],
    [
      "construction-materials",
      "Busca compras de materiales de construcción.",
      "Find construction material purchases.",
    ],
    [
      "works-supervision",
      "Muéstrame servicios de supervisión de obras.",
      "Show me construction supervision services.",
    ],
    [
      "road-suppliers",
      "¿Qué proveedores tienen más adjudicaciones de mantenimiento vial?",
      "Which suppliers have the most road maintenance awards?",
    ],
  ],
  education: [
    ["textbooks", "Muéstrame compras de libros de texto.", "Show me textbook purchases."],
    [
      "school-desks",
      "¿Qué instituciones compraron pupitres?",
      "Which institutions purchased school desks?",
    ],
    ["school-supplies", "Busca compras de útiles escolares.", "Find school supply purchases."],
    [
      "teaching-materials",
      "Muéstrame procedimientos de adquisición de material didáctico.",
      "Show me teaching material procurement procedures.",
    ],
    ["school-uniforms", "Busca compras de uniformes escolares.", "Find school uniform purchases."],
    [
      "teacher-training",
      "¿Qué contrataciones de capacitación docente hay registradas?",
      "What teacher training procurement is recorded?",
    ],
    [
      "library-equipment",
      "Muéstrame compras de mobiliario para bibliotecas.",
      "Show me library furniture purchases.",
    ],
    [
      "school-transport",
      "Busca servicios de transporte escolar.",
      "Find school transport services.",
    ],
    [
      "sports-equipment",
      "Muéstrame las compras más recientes de equipo deportivo.",
      "Show me the most recent sports equipment purchases.",
    ],
    [
      "education-suppliers",
      "¿Qué proveedores tienen más adjudicaciones de útiles escolares?",
      "Which suppliers have the most school supply awards?",
    ],
  ],
  transport: [
    ["vehicles", "Muéstrame compras de vehículos.", "Show me vehicle purchases."],
    ["fuel", "¿Qué instituciones compraron combustible?", "Which institutions purchased fuel?"],
    [
      "vehicle-maintenance",
      "Busca servicios de mantenimiento de vehículos.",
      "Find vehicle maintenance services.",
    ],
    ["tires", "Muéstrame compras de llantas.", "Show me tire purchases."],
    [
      "spare-parts",
      "Busca procedimientos de compra de repuestos para vehículos.",
      "Find vehicle spare parts procurement procedures.",
    ],
    [
      "vehicle-rental",
      "¿Qué instituciones contrataron alquiler de vehículos?",
      "Which institutions procured vehicle rental services?",
    ],
    [
      "motorcycles",
      "Muéstrame las compras más recientes de motocicletas.",
      "Show me the most recent motorcycle purchases.",
    ],
    ["freight", "Busca servicios de transporte de carga.", "Find freight transport services."],
    [
      "heavy-machinery",
      "Muéstrame procedimientos de compra de maquinaria pesada.",
      "Show me heavy machinery procurement procedures.",
    ],
    [
      "fuel-suppliers",
      "¿Qué proveedores tienen más adjudicaciones de combustible?",
      "Which suppliers have the most fuel awards?",
    ],
  ],
  supplies: [
    [
      "office-supplies",
      "Muéstrame compras de suministros de oficina.",
      "Show me office supply purchases.",
    ],
    [
      "office-furniture",
      "¿Qué instituciones compraron mobiliario de oficina?",
      "Which institutions purchased office furniture?",
    ],
    ["paper", "Busca procedimientos de compra de papel.", "Find paper procurement procedures."],
    [
      "cleaning-products",
      "Muéstrame compras de productos de limpieza.",
      "Show me cleaning product purchases.",
    ],
    ["work-uniforms", "Busca compras de uniformes para personal.", "Find staff uniform purchases."],
    [
      "protective-equipment",
      "¿Qué compras de equipo de protección personal hay registradas?",
      "What personal protective equipment purchases are recorded?",
    ],
    [
      "toner",
      "Muéstrame las compras más recientes de tinta y tóner.",
      "Show me the most recent ink and toner purchases.",
    ],
    [
      "air-conditioning",
      "Busca compras de equipos de aire acondicionado.",
      "Find air conditioning equipment purchases.",
    ],
    [
      "tools",
      "Muéstrame procedimientos de compra de herramientas.",
      "Show me tool procurement procedures.",
    ],
    [
      "furniture-suppliers",
      "¿Qué proveedores tienen más adjudicaciones de mobiliario?",
      "Which suppliers have the most furniture awards?",
    ],
  ],
  services: [
    [
      "cleaning-services",
      "Muéstrame contrataciones de servicios de limpieza.",
      "Show me cleaning service procurement.",
    ],
    [
      "security-services",
      "¿Qué instituciones contrataron servicios de vigilancia?",
      "Which institutions procured security guard services?",
    ],
    ["insurance", "Busca contrataciones de seguros.", "Find insurance procurement."],
    [
      "consulting",
      "Muéstrame procedimientos de contratación de consultorías.",
      "Show me consulting service procurement procedures.",
    ],
    ["printing", "Busca servicios de impresión de documentos.", "Find document printing services."],
    [
      "staff-training",
      "¿Qué instituciones contrataron capacitación para su personal?",
      "Which institutions procured staff training?",
    ],
    [
      "auditing",
      "Muéstrame las contrataciones más recientes de auditoría.",
      "Show me the most recent auditing service procurement.",
    ],
    [
      "equipment-maintenance",
      "Busca servicios de mantenimiento de equipos.",
      "Find equipment maintenance services.",
    ],
    [
      "building-rental",
      "Muéstrame contrataciones de alquiler de inmuebles.",
      "Show me property rental procurement.",
    ],
    [
      "telephony",
      "¿Qué contrataciones de servicios de telefonía hay registradas?",
      "What telephone service procurement is recorded?",
    ],
  ],
  food: [
    ["food-purchases", "Muéstrame compras de alimentos.", "Show me food purchases."],
    [
      "school-meals",
      "Busca contrataciones relacionadas con alimentación escolar.",
      "Find procurement related to school meals.",
    ],
    [
      "drinking-water",
      "¿Qué instituciones compraron agua embotellada?",
      "Which institutions purchased bottled water?",
    ],
    [
      "food-baskets",
      "Muéstrame procedimientos de compra de canastas de alimentos.",
      "Show me food basket procurement procedures.",
    ],
    [
      "catering",
      "Busca contrataciones de servicios de alimentación.",
      "Find catering service procurement.",
    ],
    [
      "kitchen-equipment",
      "Muéstrame compras de equipo de cocina.",
      "Show me kitchen equipment purchases.",
    ],
    [
      "hospital-meals",
      "¿Qué contrataciones de alimentación para hospitales hay registradas?",
      "What hospital meal procurement is recorded?",
    ],
    [
      "food-suppliers",
      "¿Qué proveedores tienen más adjudicaciones de alimentos?",
      "Which suppliers have the most food awards?",
    ],
    [
      "food-counts",
      "¿Cuántos procedimientos de compra de alimentos hay por país?",
      "How many food procurement procedures are there in each country?",
    ],
    [
      "food-refrigeration",
      "Busca compras de equipos de refrigeración para alimentos.",
      "Find food refrigeration equipment purchases.",
    ],
  ],
  environment: [
    [
      "waste-collection",
      "Muéstrame contrataciones de recolección de residuos.",
      "Show me waste collection procurement.",
    ],
    [
      "reforestation",
      "Busca procedimientos relacionados con reforestación.",
      "Find procurement procedures related to reforestation.",
    ],
    [
      "solar-panels",
      "¿Qué instituciones compraron paneles solares?",
      "Which institutions purchased solar panels?",
    ],
    [
      "water-treatment",
      "Muéstrame contrataciones de tratamiento de aguas residuales.",
      "Show me wastewater treatment procurement.",
    ],
    [
      "recycling",
      "Busca procedimientos relacionados con reciclaje.",
      "Find procurement procedures related to recycling.",
    ],
    [
      "park-maintenance",
      "Muéstrame servicios de mantenimiento de parques.",
      "Show me park maintenance services.",
    ],
    [
      "street-lighting",
      "¿Qué contrataciones de alumbrado público hay registradas?",
      "What street lighting procurement is recorded?",
    ],
    [
      "environmental-studies",
      "Busca contrataciones de estudios de impacto ambiental.",
      "Find environmental impact study procurement.",
    ],
    [
      "seeds",
      "Muéstrame las compras más recientes de semillas.",
      "Show me the most recent seed purchases.",
    ],
    ["irrigation", "Busca compras de equipos de riego.", "Find irrigation equipment purchases."],
  ],
  procurement: [
    [
      "process-counts",
      "¿Cuántos procedimientos hay registrados por país?",
      "How many procurement procedures are recorded in each country?",
    ],
    [
      "buyer-ranking",
      "¿Qué instituciones publicaron más procedimientos?",
      "Which institutions published the most procurement procedures?",
    ],
    [
      "supplier-ranking",
      "¿Qué proveedores recibieron más adjudicaciones?",
      "Which suppliers received the most awards?",
    ],
    [
      "direct-awards",
      "¿Qué instituciones hicieron más compras por contratación directa?",
      "Which institutions made the most direct procurement purchases?",
    ],
    [
      "status-counts",
      "Muéstrame cuántos procedimientos hay por estado y país.",
      "Show me procurement procedure counts by status and country.",
    ],
    [
      "recent-processes",
      "¿Cuáles son los procedimientos publicados más recientemente?",
      "Which procurement procedures were published most recently?",
    ],
    [
      "cancelled-processes",
      "Muéstrame los procedimientos cancelados más recientes.",
      "Show me the most recently cancelled procurement procedures.",
    ],
    [
      "procurement-methods",
      "¿Cuáles son las modalidades de contratación más utilizadas por país?",
      "Which procurement methods are used most often in each country?",
    ],
    [
      "monthly-processes",
      "¿Cómo varía el número de procedimientos publicados por mes?",
      "How does the number of published procurement procedures vary by month?",
    ],
    [
      "awarded-amounts",
      "Muéstrame los montos adjudicados por país, separados por moneda.",
      "Show me awarded amounts by country, separated by currency.",
    ],
  ],
} as const;

export type ExampleCategory = keyof typeof groups;
export type ExampleQuestion = {
  id: string;
  category: ExampleCategory;
  text: Record<Language, string>;
};

export const EXAMPLE_QUESTIONS: readonly ExampleQuestion[] = Object.entries(groups).flatMap(
  ([category, questions]) =>
    questions.map(([id, es, en]) => ({
      id,
      category: category as ExampleCategory,
      text: { es, en },
    })),
);
