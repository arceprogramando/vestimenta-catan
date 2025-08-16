--
-- PostgreSQL database cluster dump
--

-- Started on 2025-08-16 11:59:54

\restrict KcojqYdd0I91RG6678pN6Y9VHrZy3f4SIdU3SwYyoh4J85bBCsi7mT4pc9lbZX3

SET default_transaction_read_only = off;

SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

--
-- Roles
--

-- CREATE ROLE postgres;
-- ALTER ROLE postgres WITH SUPERUSER INHERIT CREATEROLE CREATEDB LOGIN REPLICATION BYPASSRLS PASSWORD 'SCRAM-SHA-256$4096:Y+PnuW8mvdKDYC2b/UGmxA==$65jNbRse2YUa8flGL/UJz7Xd8e+eu1SXRpz3xRqraFM=:5v0CY3BU6F1BCL80l5pZjrZ+CmOKncEvGonkat9KZZ0=';

--
-- User Configurations
--








\unrestrict KcojqYdd0I91RG6678pN6Y9VHrZy3f4SIdU3SwYyoh4J85bBCsi7mT4pc9lbZX3

--
-- Databases
--

--
-- Database "template1" dump
--

\connect template1

--
-- PostgreSQL database dump
--

\restrict L3dnbZi830evQDdM18A6WIe5uTH4JgSNcVhxAtOY83cucBi3mpWz5UdgcbWJdHq

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

-- Started on 2025-08-16 11:59:54

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

-- Completed on 2025-08-16 11:59:55

--
-- PostgreSQL database dump complete
--

\unrestrict L3dnbZi830evQDdM18A6WIe5uTH4JgSNcVhxAtOY83cucBi3mpWz5UdgcbWJdHq

--
-- Database "VestimentaCatan" dump
--

--
-- PostgreSQL database dump
--

\restrict CpuyGFrTqU7DltyQme0PtKjtdUJ9iPhKOh7nUbVtNAROWakAkW6tLn3s4U0Z1Re

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

-- Started on 2025-08-16 11:59:55

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 4985 (class 1262 OID 16563)
-- Name: VestimentaCatan; Type: DATABASE; Schema: -; Owner: postgres
--

CREATE DATABASE "VestimentaCatan" WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'C';


ALTER DATABASE "VestimentaCatan" OWNER TO "FelipeArce";

\unrestrict CpuyGFrTqU7DltyQme0PtKjtdUJ9iPhKOh7nUbVtNAROWakAkW6tLn3s4U0Z1Re
\connect "VestimentaCatan"
\restrict CpuyGFrTqU7DltyQme0PtKjtdUJ9iPhKOh7nUbVtNAROWakAkW6tLn3s4U0Z1Re

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 6 (class 2615 OID 16564)
-- Name: inventario; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA inventario;


ALTER SCHEMA inventario OWNER TO postgres;

--
-- TOC entry 858 (class 1247 OID 16566)
-- Name: genero; Type: TYPE; Schema: inventario; Owner: postgres
--

CREATE TYPE inventario.genero AS ENUM (
    'mujer',
    'hombre',
    'niños unisex'
);


ALTER TYPE inventario.genero OWNER TO postgres;

--
-- TOC entry 229 (class 1255 OID 16573)
-- Name: touch_updated_at(); Type: FUNCTION; Schema: inventario; Owner: postgres
--

CREATE FUNCTION inventario.touch_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at := CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION inventario.touch_updated_at() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 219 (class 1259 OID 16575)
-- Name: colores; Type: TABLE; Schema: inventario; Owner: postgres
--

CREATE TABLE inventario.colores (
    id bigint NOT NULL,
    nombre text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE inventario.colores OWNER TO postgres;

--
-- TOC entry 218 (class 1259 OID 16574)
-- Name: colores_id_seq; Type: SEQUENCE; Schema: inventario; Owner: postgres
--

CREATE SEQUENCE inventario.colores_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE inventario.colores_id_seq OWNER TO postgres;

--
-- TOC entry 4986 (class 0 OID 0)
-- Dependencies: 218
-- Name: colores_id_seq; Type: SEQUENCE OWNED BY; Schema: inventario; Owner: postgres
--

ALTER SEQUENCE inventario.colores_id_seq OWNED BY inventario.colores.id;


--
-- TOC entry 224 (class 1259 OID 16610)
-- Name: producto_variantes; Type: TABLE; Schema: inventario; Owner: postgres
--

CREATE TABLE inventario.producto_variantes (
    id bigint NOT NULL,
    producto_id integer NOT NULL,
    talle_id bigint,
    color_id bigint NOT NULL,
    cantidad integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT producto_variantes_cantidad_check CHECK ((cantidad >= 0))
);


ALTER TABLE inventario.producto_variantes OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 16609)
-- Name: producto_variantes_id_seq; Type: SEQUENCE; Schema: inventario; Owner: postgres
--

CREATE SEQUENCE inventario.producto_variantes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE inventario.producto_variantes_id_seq OWNER TO postgres;

--
-- TOC entry 4987 (class 0 OID 0)
-- Dependencies: 223
-- Name: producto_variantes_id_seq; Type: SEQUENCE OWNED BY; Schema: inventario; Owner: postgres
--

ALTER SEQUENCE inventario.producto_variantes_id_seq OWNED BY inventario.producto_variantes.id;


--
-- TOC entry 222 (class 1259 OID 16600)
-- Name: productos; Type: TABLE; Schema: inventario; Owner: postgres
--

CREATE TABLE inventario.productos (
    id integer NOT NULL,
    nombre text NOT NULL,
    descripcion text,
    genero inventario.genero NOT NULL,
    thumbnail text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE inventario.productos OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 16638)
-- Name: reservas; Type: TABLE; Schema: inventario; Owner: postgres
--

CREATE TABLE inventario.reservas (
    id bigint NOT NULL,
    producto_id integer NOT NULL,
    talle_id bigint,
    color_id bigint NOT NULL,
    cantidad integer NOT NULL,
    estado text NOT NULL,
    fecha_reserva timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT reservas_cantidad_check CHECK ((cantidad > 0)),
    CONSTRAINT reservas_estado_check CHECK ((estado = ANY (ARRAY['pendiente'::text, 'confirmado'::text, 'cancelado'::text])))
);


ALTER TABLE inventario.reservas OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 16637)
-- Name: reservas_id_seq; Type: SEQUENCE; Schema: inventario; Owner: postgres
--

CREATE SEQUENCE inventario.reservas_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE inventario.reservas_id_seq OWNER TO postgres;

--
-- TOC entry 4988 (class 0 OID 0)
-- Dependencies: 225
-- Name: reservas_id_seq; Type: SEQUENCE OWNED BY; Schema: inventario; Owner: postgres
--

ALTER SEQUENCE inventario.reservas_id_seq OWNED BY inventario.reservas.id;


--
-- TOC entry 221 (class 1259 OID 16588)
-- Name: talles; Type: TABLE; Schema: inventario; Owner: postgres
--

CREATE TABLE inventario.talles (
    id bigint NOT NULL,
    nombre_talle text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE inventario.talles OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 16587)
-- Name: talles_id_seq; Type: SEQUENCE; Schema: inventario; Owner: postgres
--

CREATE SEQUENCE inventario.talles_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE inventario.talles_id_seq OWNER TO postgres;

--
-- TOC entry 4989 (class 0 OID 0)
-- Dependencies: 220
-- Name: talles_id_seq; Type: SEQUENCE OWNED BY; Schema: inventario; Owner: postgres
--

ALTER SEQUENCE inventario.talles_id_seq OWNED BY inventario.talles.id;


--
-- TOC entry 227 (class 1259 OID 16675)
-- Name: v_inventario; Type: VIEW; Schema: inventario; Owner: postgres
--

CREATE VIEW inventario.v_inventario AS
 SELECT pv.id,
    p.id AS producto_id,
    p.nombre AS producto,
    p.descripcion,
    p.genero,
    t.nombre_talle AS talle,
    c.nombre AS color,
    pv.cantidad,
    pv.created_at,
    pv.updated_at
   FROM (((inventario.producto_variantes pv
     JOIN inventario.productos p ON ((p.id = pv.producto_id)))
     LEFT JOIN inventario.talles t ON ((t.id = pv.talle_id)))
     JOIN inventario.colores c ON ((c.id = pv.color_id)));


ALTER VIEW inventario.v_inventario OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 16680)
-- Name: v_stock_total; Type: VIEW; Schema: inventario; Owner: postgres
--

CREATE VIEW inventario.v_stock_total AS
 SELECT producto_id,
    sum(cantidad) AS total
   FROM inventario.producto_variantes
  GROUP BY producto_id;


ALTER VIEW inventario.v_stock_total OWNER TO postgres;

--
-- TOC entry 4774 (class 2604 OID 16578)
-- Name: colores id; Type: DEFAULT; Schema: inventario; Owner: postgres
--

ALTER TABLE ONLY inventario.colores ALTER COLUMN id SET DEFAULT nextval('inventario.colores_id_seq'::regclass);


--
-- TOC entry 4782 (class 2604 OID 16613)
-- Name: producto_variantes id; Type: DEFAULT; Schema: inventario; Owner: postgres
--

ALTER TABLE ONLY inventario.producto_variantes ALTER COLUMN id SET DEFAULT nextval('inventario.producto_variantes_id_seq'::regclass);


--
-- TOC entry 4786 (class 2604 OID 16641)
-- Name: reservas id; Type: DEFAULT; Schema: inventario; Owner: postgres
--

ALTER TABLE ONLY inventario.reservas ALTER COLUMN id SET DEFAULT nextval('inventario.reservas_id_seq'::regclass);


--
-- TOC entry 4777 (class 2604 OID 16591)
-- Name: talles id; Type: DEFAULT; Schema: inventario; Owner: postgres
--

ALTER TABLE ONLY inventario.talles ALTER COLUMN id SET DEFAULT nextval('inventario.talles_id_seq'::regclass);


--
-- TOC entry 4972 (class 0 OID 16575)
-- Dependencies: 219
-- Data for Name: colores; Type: TABLE DATA; Schema: inventario; Owner: postgres
--

COPY inventario.colores (id, nombre, created_at, updated_at) FROM stdin;
1	blanco	2025-08-16 03:26:14.084061+00	2025-08-16 03:26:14.084061+00
2	negro	2025-08-16 03:26:14.084061+00	2025-08-16 03:26:14.084061+00
3	gris	2025-08-16 03:26:14.084061+00	2025-08-16 03:26:14.084061+00
4	azul	2025-08-16 03:26:14.084061+00	2025-08-16 03:26:14.084061+00
\.


--
-- TOC entry 4977 (class 0 OID 16610)
-- Dependencies: 224
-- Data for Name: producto_variantes; Type: TABLE DATA; Schema: inventario; Owner: postgres
--

COPY inventario.producto_variantes (id, producto_id, talle_id, color_id, cantidad, created_at, updated_at) FROM stdin;
1	3	15	1	6	2025-08-16 04:21:58.219097+00	2025-08-16 04:21:58.219097+00
2	3	14	1	6	2025-08-16 04:21:58.219097+00	2025-08-16 04:21:58.219097+00
3	3	13	1	6	2025-08-16 04:21:58.219097+00	2025-08-16 04:21:58.219097+00
4	3	12	1	5	2025-08-16 04:21:58.219097+00	2025-08-16 04:21:58.219097+00
5	3	11	1	6	2025-08-16 04:21:58.219097+00	2025-08-16 04:21:58.219097+00
6	3	10	1	6	2025-08-16 04:21:58.219097+00	2025-08-16 04:21:58.219097+00
7	1	8	1	5	2025-08-16 04:21:58.219097+00	2025-08-16 04:21:58.219097+00
8	1	7	1	4	2025-08-16 04:21:58.219097+00	2025-08-16 04:21:58.219097+00
9	1	6	1	3	2025-08-16 04:21:58.219097+00	2025-08-16 04:21:58.219097+00
10	2	5	1	1	2025-08-16 04:21:58.219097+00	2025-08-16 04:21:58.219097+00
11	2	4	1	3	2025-08-16 04:21:58.219097+00	2025-08-16 04:21:58.219097+00
12	2	3	1	4	2025-08-16 04:21:58.219097+00	2025-08-16 04:21:58.219097+00
13	2	2	1	6	2025-08-16 04:21:58.219097+00	2025-08-16 04:21:58.219097+00
14	2	1	1	4	2025-08-16 04:21:58.219097+00	2025-08-16 04:21:58.219097+00
15	4	\N	2	2	2025-08-16 04:21:58.219097+00	2025-08-16 04:21:58.219097+00
16	5	\N	2	1	2025-08-16 04:21:58.219097+00	2025-08-16 04:21:58.219097+00
17	3	15	2	4	2025-08-16 04:21:58.219097+00	2025-08-16 04:21:58.219097+00
18	3	14	2	5	2025-08-16 04:21:58.219097+00	2025-08-16 04:21:58.219097+00
19	3	13	2	4	2025-08-16 04:21:58.219097+00	2025-08-16 04:21:58.219097+00
20	3	12	2	5	2025-08-16 04:21:58.219097+00	2025-08-16 04:21:58.219097+00
21	3	11	2	4	2025-08-16 04:21:58.219097+00	2025-08-16 04:21:58.219097+00
22	3	10	2	3	2025-08-16 04:21:58.219097+00	2025-08-16 04:21:58.219097+00
23	1	9	2	11	2025-08-16 04:21:58.219097+00	2025-08-16 04:21:58.219097+00
24	5	9	2	1	2025-08-16 04:21:58.219097+00	2025-08-16 04:21:58.219097+00
25	1	8	2	3	2025-08-16 04:21:58.219097+00	2025-08-16 04:21:58.219097+00
26	5	8	2	2	2025-08-16 04:21:58.219097+00	2025-08-16 04:21:58.219097+00
27	1	7	2	4	2025-08-16 04:21:58.219097+00	2025-08-16 04:21:58.219097+00
28	5	7	2	3	2025-08-16 04:21:58.219097+00	2025-08-16 04:21:58.219097+00
29	2	5	2	5	2025-08-16 04:21:58.219097+00	2025-08-16 04:21:58.219097+00
30	4	5	2	5	2025-08-16 04:21:58.219097+00	2025-08-16 04:21:58.219097+00
31	2	4	2	5	2025-08-16 04:21:58.219097+00	2025-08-16 04:21:58.219097+00
32	4	4	2	3	2025-08-16 04:21:58.219097+00	2025-08-16 04:21:58.219097+00
33	2	3	2	4	2025-08-16 04:21:58.219097+00	2025-08-16 04:21:58.219097+00
34	4	3	2	5	2025-08-16 04:21:58.219097+00	2025-08-16 04:21:58.219097+00
35	2	2	2	5	2025-08-16 04:21:58.219097+00	2025-08-16 04:21:58.219097+00
36	4	2	2	5	2025-08-16 04:21:58.219097+00	2025-08-16 04:21:58.219097+00
37	2	1	2	0	2025-08-16 04:21:58.219097+00	2025-08-16 04:21:58.219097+00
38	3	15	3	4	2025-08-16 04:21:58.219097+00	2025-08-16 04:21:58.219097+00
39	3	11	3	5	2025-08-16 04:21:58.219097+00	2025-08-16 04:21:58.219097+00
40	3	10	3	4	2025-08-16 04:21:58.219097+00	2025-08-16 04:21:58.219097+00
41	1	9	3	3	2025-08-16 04:21:58.219097+00	2025-08-16 04:21:58.219097+00
42	1	8	3	4	2025-08-16 04:21:58.219097+00	2025-08-16 04:21:58.219097+00
43	1	7	3	2	2025-08-16 04:21:58.219097+00	2025-08-16 04:21:58.219097+00
44	1	6	3	2	2025-08-16 04:21:58.219097+00	2025-08-16 04:21:58.219097+00
45	2	5	3	2	2025-08-16 04:21:58.219097+00	2025-08-16 04:21:58.219097+00
46	2	4	3	2	2025-08-16 04:21:58.219097+00	2025-08-16 04:21:58.219097+00
47	2	3	3	2	2025-08-16 04:21:58.219097+00	2025-08-16 04:21:58.219097+00
48	2	2	3	4	2025-08-16 04:21:58.219097+00	2025-08-16 04:21:58.219097+00
49	2	1	3	1	2025-08-16 04:21:58.219097+00	2025-08-16 04:21:58.219097+00
50	3	15	4	4	2025-08-16 04:21:58.219097+00	2025-08-16 04:21:58.219097+00
51	3	14	4	5	2025-08-16 04:21:58.219097+00	2025-08-16 04:21:58.219097+00
52	3	13	4	4	2025-08-16 04:21:58.219097+00	2025-08-16 04:21:58.219097+00
53	3	12	4	4	2025-08-16 04:21:58.219097+00	2025-08-16 04:21:58.219097+00
54	3	11	4	4	2025-08-16 04:21:58.219097+00	2025-08-16 04:21:58.219097+00
55	3	10	4	2	2025-08-16 04:21:58.219097+00	2025-08-16 04:21:58.219097+00
56	1	9	4	4	2025-08-16 04:21:58.219097+00	2025-08-16 04:21:58.219097+00
57	1	8	4	2	2025-08-16 04:21:58.219097+00	2025-08-16 04:21:58.219097+00
58	1	7	4	1	2025-08-16 04:21:58.219097+00	2025-08-16 04:21:58.219097+00
59	2	5	4	3	2025-08-16 04:21:58.219097+00	2025-08-16 04:21:58.219097+00
60	2	4	4	4	2025-08-16 04:21:58.219097+00	2025-08-16 04:21:58.219097+00
61	2	3	4	2	2025-08-16 04:21:58.219097+00	2025-08-16 04:21:58.219097+00
62	2	2	4	5	2025-08-16 04:21:58.219097+00	2025-08-16 04:21:58.219097+00
63	2	1	4	0	2025-08-16 04:21:58.219097+00	2025-08-16 04:21:58.219097+00
\.


--
-- TOC entry 4975 (class 0 OID 16600)
-- Dependencies: 222
-- Data for Name: productos; Type: TABLE DATA; Schema: inventario; Owner: postgres
--

COPY inventario.productos (id, nombre, descripcion, genero, thumbnail, created_at, updated_at) FROM stdin;
1	remera térmica	Remera térmica para mujer.	mujer	/images/products/remera-termica-mujer-1.jpeg	2025-08-16 04:21:58.219097+00	2025-08-16 04:21:58.219097+00
2	remera térmica	Remera térmica para hombre.	hombre	/images/products/remera-termica-hombre-1.jpeg	2025-08-16 04:21:58.219097+00	2025-08-16 04:21:58.219097+00
3	remera térmica	Remera térmica niños/unisex.	niños unisex	/images/products/remera-termica-ninios-1.jpeg	2025-08-16 04:21:58.219097+00	2025-08-16 04:21:58.219097+00
4	calza térmica	Calza térmica para hombre.	hombre	/images/products/calza-termica-hombre-1.png	2025-08-16 04:21:58.219097+00	2025-08-16 04:21:58.219097+00
5	calza térmica	Calza térmica para mujer.	mujer	/images/products/calza-termica-hombre-1.png	2025-08-16 04:21:58.219097+00	2025-08-16 04:21:58.219097+00
\.


--
-- TOC entry 4979 (class 0 OID 16638)
-- Dependencies: 226
-- Data for Name: reservas; Type: TABLE DATA; Schema: inventario; Owner: postgres
--

COPY inventario.reservas (id, producto_id, talle_id, color_id, cantidad, estado, fecha_reserva, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 4974 (class 0 OID 16588)
-- Dependencies: 221
-- Data for Name: talles; Type: TABLE DATA; Schema: inventario; Owner: postgres
--

COPY inventario.talles (id, nombre_talle, created_at, updated_at) FROM stdin;
1	S	2025-08-16 03:26:14.084061+00	2025-08-16 03:26:14.084061+00
2	M	2025-08-16 03:26:14.084061+00	2025-08-16 03:26:14.084061+00
3	L	2025-08-16 03:26:14.084061+00	2025-08-16 03:26:14.084061+00
4	XL	2025-08-16 03:26:14.084061+00	2025-08-16 03:26:14.084061+00
5	XXL	2025-08-16 03:26:14.084061+00	2025-08-16 03:26:14.084061+00
6	1	2025-08-16 03:26:14.084061+00	2025-08-16 03:26:14.084061+00
7	2	2025-08-16 03:26:14.084061+00	2025-08-16 03:26:14.084061+00
8	3	2025-08-16 03:26:14.084061+00	2025-08-16 03:26:14.084061+00
9	4	2025-08-16 03:26:14.084061+00	2025-08-16 03:26:14.084061+00
10	6	2025-08-16 03:26:14.084061+00	2025-08-16 03:26:14.084061+00
11	8	2025-08-16 03:26:14.084061+00	2025-08-16 03:26:14.084061+00
12	10	2025-08-16 03:26:14.084061+00	2025-08-16 03:26:14.084061+00
13	12	2025-08-16 03:26:14.084061+00	2025-08-16 03:26:14.084061+00
14	14	2025-08-16 03:26:14.084061+00	2025-08-16 03:26:14.084061+00
15	16	2025-08-16 03:26:14.084061+00	2025-08-16 03:26:14.084061+00
\.


--
-- TOC entry 4990 (class 0 OID 0)
-- Dependencies: 218
-- Name: colores_id_seq; Type: SEQUENCE SET; Schema: inventario; Owner: postgres
--

SELECT pg_catalog.setval('inventario.colores_id_seq', 12, true);


--
-- TOC entry 4991 (class 0 OID 0)
-- Dependencies: 223
-- Name: producto_variantes_id_seq; Type: SEQUENCE SET; Schema: inventario; Owner: postgres
--

SELECT pg_catalog.setval('inventario.producto_variantes_id_seq', 63, true);


--
-- TOC entry 4992 (class 0 OID 0)
-- Dependencies: 225
-- Name: reservas_id_seq; Type: SEQUENCE SET; Schema: inventario; Owner: postgres
--

SELECT pg_catalog.setval('inventario.reservas_id_seq', 1, false);


--
-- TOC entry 4993 (class 0 OID 0)
-- Dependencies: 220
-- Name: talles_id_seq; Type: SEQUENCE SET; Schema: inventario; Owner: postgres
--

SELECT pg_catalog.setval('inventario.talles_id_seq', 30, true);


--
-- TOC entry 4794 (class 2606 OID 16586)
-- Name: colores colores_nombre_key; Type: CONSTRAINT; Schema: inventario; Owner: postgres
--

ALTER TABLE ONLY inventario.colores
    ADD CONSTRAINT colores_nombre_key UNIQUE (nombre);


--
-- TOC entry 4796 (class 2606 OID 16584)
-- Name: colores colores_pkey; Type: CONSTRAINT; Schema: inventario; Owner: postgres
--

ALTER TABLE ONLY inventario.colores
    ADD CONSTRAINT colores_pkey PRIMARY KEY (id);


--
-- TOC entry 4808 (class 2606 OID 16619)
-- Name: producto_variantes producto_variantes_pkey; Type: CONSTRAINT; Schema: inventario; Owner: postgres
--

ALTER TABLE ONLY inventario.producto_variantes
    ADD CONSTRAINT producto_variantes_pkey PRIMARY KEY (id);


--
-- TOC entry 4802 (class 2606 OID 16608)
-- Name: productos productos_pkey; Type: CONSTRAINT; Schema: inventario; Owner: postgres
--

ALTER TABLE ONLY inventario.productos
    ADD CONSTRAINT productos_pkey PRIMARY KEY (id);


--
-- TOC entry 4812 (class 2606 OID 16650)
-- Name: reservas reservas_pkey; Type: CONSTRAINT; Schema: inventario; Owner: postgres
--

ALTER TABLE ONLY inventario.reservas
    ADD CONSTRAINT reservas_pkey PRIMARY KEY (id);


--
-- TOC entry 4798 (class 2606 OID 16599)
-- Name: talles talles_label_key; Type: CONSTRAINT; Schema: inventario; Owner: postgres
--

ALTER TABLE ONLY inventario.talles
    ADD CONSTRAINT talles_label_key UNIQUE (nombre_talle);


--
-- TOC entry 4800 (class 2606 OID 16597)
-- Name: talles talles_pkey; Type: CONSTRAINT; Schema: inventario; Owner: postgres
--

ALTER TABLE ONLY inventario.talles
    ADD CONSTRAINT talles_pkey PRIMARY KEY (id);


--
-- TOC entry 4810 (class 2606 OID 16621)
-- Name: producto_variantes ux_prod_talle_color; Type: CONSTRAINT; Schema: inventario; Owner: postgres
--

ALTER TABLE ONLY inventario.producto_variantes
    ADD CONSTRAINT ux_prod_talle_color UNIQUE (producto_id, talle_id, color_id);


--
-- TOC entry 4803 (class 1259 OID 16668)
-- Name: ix_var_color; Type: INDEX; Schema: inventario; Owner: postgres
--

CREATE INDEX ix_var_color ON inventario.producto_variantes USING btree (color_id);


--
-- TOC entry 4804 (class 1259 OID 16669)
-- Name: ix_var_combo; Type: INDEX; Schema: inventario; Owner: postgres
--

CREATE INDEX ix_var_combo ON inventario.producto_variantes USING btree (producto_id, talle_id, color_id);


--
-- TOC entry 4805 (class 1259 OID 16666)
-- Name: ix_var_prod; Type: INDEX; Schema: inventario; Owner: postgres
--

CREATE INDEX ix_var_prod ON inventario.producto_variantes USING btree (producto_id);


--
-- TOC entry 4806 (class 1259 OID 16667)
-- Name: ix_var_talle; Type: INDEX; Schema: inventario; Owner: postgres
--

CREATE INDEX ix_var_talle ON inventario.producto_variantes USING btree (talle_id);


--
-- TOC entry 4819 (class 2620 OID 16670)
-- Name: colores trg_touch_updated_at_colores; Type: TRIGGER; Schema: inventario; Owner: postgres
--

CREATE TRIGGER trg_touch_updated_at_colores BEFORE INSERT OR UPDATE ON inventario.colores FOR EACH ROW EXECUTE FUNCTION inventario.touch_updated_at();


--
-- TOC entry 4821 (class 2620 OID 16672)
-- Name: productos trg_touch_updated_at_productos; Type: TRIGGER; Schema: inventario; Owner: postgres
--

CREATE TRIGGER trg_touch_updated_at_productos BEFORE INSERT OR UPDATE ON inventario.productos FOR EACH ROW EXECUTE FUNCTION inventario.touch_updated_at();


--
-- TOC entry 4823 (class 2620 OID 16674)
-- Name: reservas trg_touch_updated_at_reservas; Type: TRIGGER; Schema: inventario; Owner: postgres
--

CREATE TRIGGER trg_touch_updated_at_reservas BEFORE INSERT OR UPDATE ON inventario.reservas FOR EACH ROW EXECUTE FUNCTION inventario.touch_updated_at();


--
-- TOC entry 4820 (class 2620 OID 16671)
-- Name: talles trg_touch_updated_at_talles; Type: TRIGGER; Schema: inventario; Owner: postgres
--

CREATE TRIGGER trg_touch_updated_at_talles BEFORE INSERT OR UPDATE ON inventario.talles FOR EACH ROW EXECUTE FUNCTION inventario.touch_updated_at();


--
-- TOC entry 4822 (class 2620 OID 16673)
-- Name: producto_variantes trg_touch_updated_at_variantes; Type: TRIGGER; Schema: inventario; Owner: postgres
--

CREATE TRIGGER trg_touch_updated_at_variantes BEFORE INSERT OR UPDATE ON inventario.producto_variantes FOR EACH ROW EXECUTE FUNCTION inventario.touch_updated_at();


--
-- TOC entry 4813 (class 2606 OID 16632)
-- Name: producto_variantes fk_pv_color; Type: FK CONSTRAINT; Schema: inventario; Owner: postgres
--

ALTER TABLE ONLY inventario.producto_variantes
    ADD CONSTRAINT fk_pv_color FOREIGN KEY (color_id) REFERENCES inventario.colores(id) ON DELETE CASCADE;


--
-- TOC entry 4814 (class 2606 OID 16622)
-- Name: producto_variantes fk_pv_producto; Type: FK CONSTRAINT; Schema: inventario; Owner: postgres
--

ALTER TABLE ONLY inventario.producto_variantes
    ADD CONSTRAINT fk_pv_producto FOREIGN KEY (producto_id) REFERENCES inventario.productos(id) ON DELETE CASCADE;


--
-- TOC entry 4815 (class 2606 OID 16627)
-- Name: producto_variantes fk_pv_talle; Type: FK CONSTRAINT; Schema: inventario; Owner: postgres
--

ALTER TABLE ONLY inventario.producto_variantes
    ADD CONSTRAINT fk_pv_talle FOREIGN KEY (talle_id) REFERENCES inventario.talles(id) ON DELETE SET NULL;


--
-- TOC entry 4816 (class 2606 OID 16661)
-- Name: reservas reservas_color_id_fkey; Type: FK CONSTRAINT; Schema: inventario; Owner: postgres
--

ALTER TABLE ONLY inventario.reservas
    ADD CONSTRAINT reservas_color_id_fkey FOREIGN KEY (color_id) REFERENCES inventario.colores(id) ON DELETE CASCADE;


--
-- TOC entry 4817 (class 2606 OID 16651)
-- Name: reservas reservas_producto_id_fkey; Type: FK CONSTRAINT; Schema: inventario; Owner: postgres
--

ALTER TABLE ONLY inventario.reservas
    ADD CONSTRAINT reservas_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES inventario.productos(id) ON DELETE CASCADE;


--
-- TOC entry 4818 (class 2606 OID 16656)
-- Name: reservas reservas_talle_id_fkey; Type: FK CONSTRAINT; Schema: inventario; Owner: postgres
--

ALTER TABLE ONLY inventario.reservas
    ADD CONSTRAINT reservas_talle_id_fkey FOREIGN KEY (talle_id) REFERENCES inventario.talles(id) ON DELETE SET NULL;


-- Completed on 2025-08-16 11:59:55

--
-- PostgreSQL database dump complete
--

\unrestrict CpuyGFrTqU7DltyQme0PtKjtdUJ9iPhKOh7nUbVtNAROWakAkW6tLn3s4U0Z1Re

--
-- Database "postgres" dump
--

\connect postgres

--
-- PostgreSQL database dump
--

\restrict k1NVCShX9ePVkVWwAQJbSHABgBZFYxbbdiS3ayjDc1BrsnQPNVeIKtCfhpcZjzy

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

-- Started on 2025-08-16 11:59:55

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

-- Completed on 2025-08-16 11:59:55

--
-- PostgreSQL database dump complete
--

\unrestrict k1NVCShX9ePVkVWwAQJbSHABgBZFYxbbdiS3ayjDc1BrsnQPNVeIKtCfhpcZjzy

-- Completed on 2025-08-16 11:59:55

--
-- PostgreSQL database cluster dump complete
--

