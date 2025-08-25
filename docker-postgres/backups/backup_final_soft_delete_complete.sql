--
-- PostgreSQL database dump
--

\restrict CaX8Z7NBQAFmxjUhZebEYZ1XZYTeZ7QLhImPWZgvIenAqQKUhvjT8zf8AhMsTmb

-- Dumped from database version 17.6 (Debian 17.6-1.pgdg13+1)
-- Dumped by pg_dump version 17.6 (Debian 17.6-1.pgdg13+1)

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
-- Name: inventario; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA inventario;


ALTER SCHEMA inventario OWNER TO postgres;

--
-- Name: genero; Type: TYPE; Schema: inventario; Owner: postgres
--

CREATE TYPE inventario.genero AS ENUM (
    'mujer',
    'hombre',
    'niños unisex'
);


ALTER TYPE inventario.genero OWNER TO postgres;

--
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
-- Name: colores; Type: TABLE; Schema: inventario; Owner: postgres
--

CREATE TABLE inventario.colores (
    id bigint NOT NULL,
    nombre text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp(6) with time zone,
    is_active boolean DEFAULT true NOT NULL,
    deleted_by text,
    delete_reason text
);


ALTER TABLE inventario.colores OWNER TO postgres;

--
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
-- Name: colores_id_seq; Type: SEQUENCE OWNED BY; Schema: inventario; Owner: postgres
--

ALTER SEQUENCE inventario.colores_id_seq OWNED BY inventario.colores.id;


--
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
    delete_reason text,
    deleted_at timestamp(6) with time zone,
    deleted_by text,
    is_active boolean DEFAULT true NOT NULL,
    CONSTRAINT producto_variantes_cantidad_check CHECK ((cantidad >= 0))
);


ALTER TABLE inventario.producto_variantes OWNER TO postgres;

--
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
-- Name: producto_variantes_id_seq; Type: SEQUENCE OWNED BY; Schema: inventario; Owner: postgres
--

ALTER SEQUENCE inventario.producto_variantes_id_seq OWNED BY inventario.producto_variantes.id;


--
-- Name: productos; Type: TABLE; Schema: inventario; Owner: postgres
--

CREATE TABLE inventario.productos (
    id integer NOT NULL,
    nombre text NOT NULL,
    descripcion text,
    genero inventario.genero NOT NULL,
    thumbnail text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    delete_reason text,
    deleted_at timestamp(6) with time zone,
    deleted_by text,
    is_active boolean DEFAULT true NOT NULL
);


ALTER TABLE inventario.productos OWNER TO postgres;

--
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
    delete_reason text,
    deleted_at timestamp(6) with time zone,
    deleted_by text,
    is_active boolean DEFAULT true NOT NULL,
    CONSTRAINT reservas_cantidad_check CHECK ((cantidad > 0)),
    CONSTRAINT reservas_estado_check CHECK ((estado = ANY (ARRAY['pendiente'::text, 'confirmado'::text, 'cancelado'::text])))
);


ALTER TABLE inventario.reservas OWNER TO postgres;

--
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
-- Name: reservas_id_seq; Type: SEQUENCE OWNED BY; Schema: inventario; Owner: postgres
--

ALTER SEQUENCE inventario.reservas_id_seq OWNED BY inventario.reservas.id;


--
-- Name: talles; Type: TABLE; Schema: inventario; Owner: postgres
--

CREATE TABLE inventario.talles (
    id bigint NOT NULL,
    nombre_talle text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp(6) with time zone,
    is_active boolean DEFAULT true NOT NULL,
    deleted_by text,
    delete_reason text
);


ALTER TABLE inventario.talles OWNER TO postgres;

--
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
-- Name: talles_id_seq; Type: SEQUENCE OWNED BY; Schema: inventario; Owner: postgres
--

ALTER SEQUENCE inventario.talles_id_seq OWNED BY inventario.talles.id;


--
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
-- Name: v_stock_total; Type: VIEW; Schema: inventario; Owner: postgres
--

CREATE VIEW inventario.v_stock_total AS
 SELECT producto_id,
    sum(cantidad) AS total
   FROM inventario.producto_variantes
  GROUP BY producto_id;


ALTER VIEW inventario.v_stock_total OWNER TO postgres;

--
-- Name: colores id; Type: DEFAULT; Schema: inventario; Owner: postgres
--

ALTER TABLE ONLY inventario.colores ALTER COLUMN id SET DEFAULT nextval('inventario.colores_id_seq'::regclass);


--
-- Name: producto_variantes id; Type: DEFAULT; Schema: inventario; Owner: postgres
--

ALTER TABLE ONLY inventario.producto_variantes ALTER COLUMN id SET DEFAULT nextval('inventario.producto_variantes_id_seq'::regclass);


--
-- Name: reservas id; Type: DEFAULT; Schema: inventario; Owner: postgres
--

ALTER TABLE ONLY inventario.reservas ALTER COLUMN id SET DEFAULT nextval('inventario.reservas_id_seq'::regclass);


--
-- Name: talles id; Type: DEFAULT; Schema: inventario; Owner: postgres
--

ALTER TABLE ONLY inventario.talles ALTER COLUMN id SET DEFAULT nextval('inventario.talles_id_seq'::regclass);


--
-- Data for Name: colores; Type: TABLE DATA; Schema: inventario; Owner: postgres
--

COPY inventario.colores (id, nombre, created_at, updated_at, deleted_at, is_active, deleted_by, delete_reason) FROM stdin;
1	blanco	2025-08-16 00:26:14.084061-03	2025-08-16 00:26:14.084061-03	\N	t	\N	\N
2	negro	2025-08-16 00:26:14.084061-03	2025-08-16 00:26:14.084061-03	\N	t	\N	\N
3	gris	2025-08-16 00:26:14.084061-03	2025-08-16 00:26:14.084061-03	\N	t	\N	\N
4	azul	2025-08-16 00:26:14.084061-03	2025-08-16 00:26:14.084061-03	\N	t	\N	\N
\.


--
-- Data for Name: producto_variantes; Type: TABLE DATA; Schema: inventario; Owner: postgres
--

COPY inventario.producto_variantes (id, producto_id, talle_id, color_id, cantidad, created_at, updated_at, delete_reason, deleted_at, deleted_by, is_active) FROM stdin;
1	3	15	1	6	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t
2	3	14	1	6	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t
3	3	13	1	6	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t
4	3	12	1	5	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t
5	3	11	1	6	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t
6	3	10	1	6	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t
7	1	8	1	5	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t
8	1	7	1	4	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t
9	1	6	1	3	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t
10	2	5	1	1	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t
11	2	4	1	3	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t
12	2	3	1	4	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t
13	2	2	1	6	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t
14	2	1	1	4	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t
15	4	\N	2	2	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t
16	5	\N	2	1	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t
17	3	15	2	4	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t
18	3	14	2	5	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t
19	3	13	2	4	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t
20	3	12	2	5	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t
21	3	11	2	4	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t
22	3	10	2	3	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t
23	1	9	2	11	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t
24	5	9	2	1	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t
25	1	8	2	3	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t
26	5	8	2	2	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t
27	1	7	2	4	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t
28	5	7	2	3	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t
29	2	5	2	5	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t
30	4	5	2	5	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t
31	2	4	2	5	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t
32	4	4	2	3	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t
33	2	3	2	4	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t
34	4	3	2	5	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t
35	2	2	2	5	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t
36	4	2	2	5	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t
37	2	1	2	0	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t
38	3	15	3	4	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t
39	3	11	3	5	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t
40	3	10	3	4	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t
41	1	9	3	3	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t
42	1	8	3	4	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t
43	1	7	3	2	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t
44	1	6	3	2	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t
45	2	5	3	2	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t
46	2	4	3	2	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t
47	2	3	3	2	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t
48	2	2	3	4	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t
49	2	1	3	1	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t
50	3	15	4	4	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t
51	3	14	4	5	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t
52	3	13	4	4	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t
53	3	12	4	4	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t
54	3	11	4	4	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t
55	3	10	4	2	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t
56	1	9	4	4	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t
57	1	8	4	2	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t
58	1	7	4	1	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t
59	2	5	4	3	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t
60	2	4	4	4	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t
61	2	3	4	2	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t
62	2	2	4	5	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t
63	2	1	4	0	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t
\.


--
-- Data for Name: productos; Type: TABLE DATA; Schema: inventario; Owner: postgres
--

COPY inventario.productos (id, nombre, descripcion, genero, thumbnail, created_at, updated_at, delete_reason, deleted_at, deleted_by, is_active) FROM stdin;
1	remera térmica	Remera térmica para mujer.	mujer	/images/products/remera-termica-mujer-1.jpeg	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t
2	remera térmica	Remera térmica para hombre.	hombre	/images/products/remera-termica-hombre-1.jpeg	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t
3	remera térmica	Remera térmica niños/unisex.	niños unisex	/images/products/remera-termica-ninios-1.jpeg	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t
4	calza térmica	Calza térmica para hombre.	hombre	/images/products/calza-termica-hombre-1.png	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t
5	calza térmica	Calza térmica para mujer.	mujer	/images/products/calza-termica-hombre-1.png	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t
\.


--
-- Data for Name: reservas; Type: TABLE DATA; Schema: inventario; Owner: postgres
--

COPY inventario.reservas (id, producto_id, talle_id, color_id, cantidad, estado, fecha_reserva, created_at, updated_at, delete_reason, deleted_at, deleted_by, is_active) FROM stdin;
\.


--
-- Data for Name: talles; Type: TABLE DATA; Schema: inventario; Owner: postgres
--

COPY inventario.talles (id, nombre_talle, created_at, updated_at, deleted_at, is_active, deleted_by, delete_reason) FROM stdin;
1	S	2025-08-16 00:26:14.084061-03	2025-08-16 00:26:14.084061-03	\N	t	\N	\N
2	M	2025-08-16 00:26:14.084061-03	2025-08-16 00:26:14.084061-03	\N	t	\N	\N
3	L	2025-08-16 00:26:14.084061-03	2025-08-16 00:26:14.084061-03	\N	t	\N	\N
4	XL	2025-08-16 00:26:14.084061-03	2025-08-16 00:26:14.084061-03	\N	t	\N	\N
5	XXL	2025-08-16 00:26:14.084061-03	2025-08-16 00:26:14.084061-03	\N	t	\N	\N
6	1	2025-08-16 00:26:14.084061-03	2025-08-16 00:26:14.084061-03	\N	t	\N	\N
7	2	2025-08-16 00:26:14.084061-03	2025-08-16 00:26:14.084061-03	\N	t	\N	\N
8	3	2025-08-16 00:26:14.084061-03	2025-08-16 00:26:14.084061-03	\N	t	\N	\N
9	4	2025-08-16 00:26:14.084061-03	2025-08-16 00:26:14.084061-03	\N	t	\N	\N
10	6	2025-08-16 00:26:14.084061-03	2025-08-16 00:26:14.084061-03	\N	t	\N	\N
11	8	2025-08-16 00:26:14.084061-03	2025-08-16 00:26:14.084061-03	\N	t	\N	\N
12	10	2025-08-16 00:26:14.084061-03	2025-08-16 00:26:14.084061-03	\N	t	\N	\N
13	12	2025-08-16 00:26:14.084061-03	2025-08-16 00:26:14.084061-03	\N	t	\N	\N
14	14	2025-08-16 00:26:14.084061-03	2025-08-16 00:26:14.084061-03	\N	t	\N	\N
15	16	2025-08-16 00:26:14.084061-03	2025-08-16 00:26:14.084061-03	\N	t	\N	\N
\.


--
-- Name: colores_id_seq; Type: SEQUENCE SET; Schema: inventario; Owner: postgres
--

SELECT pg_catalog.setval('inventario.colores_id_seq', 12, true);


--
-- Name: producto_variantes_id_seq; Type: SEQUENCE SET; Schema: inventario; Owner: postgres
--

SELECT pg_catalog.setval('inventario.producto_variantes_id_seq', 63, true);


--
-- Name: reservas_id_seq; Type: SEQUENCE SET; Schema: inventario; Owner: postgres
--

SELECT pg_catalog.setval('inventario.reservas_id_seq', 1, false);


--
-- Name: talles_id_seq; Type: SEQUENCE SET; Schema: inventario; Owner: postgres
--

SELECT pg_catalog.setval('inventario.talles_id_seq', 30, true);


--
-- Name: colores colores_nombre_key; Type: CONSTRAINT; Schema: inventario; Owner: postgres
--

ALTER TABLE ONLY inventario.colores
    ADD CONSTRAINT colores_nombre_key UNIQUE (nombre);


--
-- Name: colores colores_pkey; Type: CONSTRAINT; Schema: inventario; Owner: postgres
--

ALTER TABLE ONLY inventario.colores
    ADD CONSTRAINT colores_pkey PRIMARY KEY (id);


--
-- Name: producto_variantes producto_variantes_pkey; Type: CONSTRAINT; Schema: inventario; Owner: postgres
--

ALTER TABLE ONLY inventario.producto_variantes
    ADD CONSTRAINT producto_variantes_pkey PRIMARY KEY (id);


--
-- Name: productos productos_pkey; Type: CONSTRAINT; Schema: inventario; Owner: postgres
--

ALTER TABLE ONLY inventario.productos
    ADD CONSTRAINT productos_pkey PRIMARY KEY (id);


--
-- Name: reservas reservas_pkey; Type: CONSTRAINT; Schema: inventario; Owner: postgres
--

ALTER TABLE ONLY inventario.reservas
    ADD CONSTRAINT reservas_pkey PRIMARY KEY (id);


--
-- Name: talles talles_label_key; Type: CONSTRAINT; Schema: inventario; Owner: postgres
--

ALTER TABLE ONLY inventario.talles
    ADD CONSTRAINT talles_label_key UNIQUE (nombre_talle);


--
-- Name: talles talles_pkey; Type: CONSTRAINT; Schema: inventario; Owner: postgres
--

ALTER TABLE ONLY inventario.talles
    ADD CONSTRAINT talles_pkey PRIMARY KEY (id);


--
-- Name: producto_variantes ux_prod_talle_color; Type: CONSTRAINT; Schema: inventario; Owner: postgres
--

ALTER TABLE ONLY inventario.producto_variantes
    ADD CONSTRAINT ux_prod_talle_color UNIQUE (producto_id, talle_id, color_id);


--
-- Name: ix_colores_active; Type: INDEX; Schema: inventario; Owner: postgres
--

CREATE INDEX ix_colores_active ON inventario.colores USING btree (is_active);


--
-- Name: ix_productos_active; Type: INDEX; Schema: inventario; Owner: postgres
--

CREATE INDEX ix_productos_active ON inventario.productos USING btree (is_active);


--
-- Name: ix_reservas_active; Type: INDEX; Schema: inventario; Owner: postgres
--

CREATE INDEX ix_reservas_active ON inventario.reservas USING btree (is_active);


--
-- Name: ix_reservas_fecha; Type: INDEX; Schema: inventario; Owner: postgres
--

CREATE INDEX ix_reservas_fecha ON inventario.reservas USING btree (fecha_reserva);


--
-- Name: ix_talles_active; Type: INDEX; Schema: inventario; Owner: postgres
--

CREATE INDEX ix_talles_active ON inventario.talles USING btree (is_active);


--
-- Name: ix_var_active; Type: INDEX; Schema: inventario; Owner: postgres
--

CREATE INDEX ix_var_active ON inventario.producto_variantes USING btree (is_active);


--
-- Name: ix_var_color; Type: INDEX; Schema: inventario; Owner: postgres
--

CREATE INDEX ix_var_color ON inventario.producto_variantes USING btree (color_id);


--
-- Name: ix_var_combo; Type: INDEX; Schema: inventario; Owner: postgres
--

CREATE INDEX ix_var_combo ON inventario.producto_variantes USING btree (producto_id, talle_id, color_id);


--
-- Name: ix_var_prod; Type: INDEX; Schema: inventario; Owner: postgres
--

CREATE INDEX ix_var_prod ON inventario.producto_variantes USING btree (producto_id);


--
-- Name: ix_var_talle; Type: INDEX; Schema: inventario; Owner: postgres
--

CREATE INDEX ix_var_talle ON inventario.producto_variantes USING btree (talle_id);


--
-- Name: colores trg_touch_updated_at_colores; Type: TRIGGER; Schema: inventario; Owner: postgres
--

CREATE TRIGGER trg_touch_updated_at_colores BEFORE INSERT OR UPDATE ON inventario.colores FOR EACH ROW EXECUTE FUNCTION inventario.touch_updated_at();


--
-- Name: productos trg_touch_updated_at_productos; Type: TRIGGER; Schema: inventario; Owner: postgres
--

CREATE TRIGGER trg_touch_updated_at_productos BEFORE INSERT OR UPDATE ON inventario.productos FOR EACH ROW EXECUTE FUNCTION inventario.touch_updated_at();


--
-- Name: reservas trg_touch_updated_at_reservas; Type: TRIGGER; Schema: inventario; Owner: postgres
--

CREATE TRIGGER trg_touch_updated_at_reservas BEFORE INSERT OR UPDATE ON inventario.reservas FOR EACH ROW EXECUTE FUNCTION inventario.touch_updated_at();


--
-- Name: talles trg_touch_updated_at_talles; Type: TRIGGER; Schema: inventario; Owner: postgres
--

CREATE TRIGGER trg_touch_updated_at_talles BEFORE INSERT OR UPDATE ON inventario.talles FOR EACH ROW EXECUTE FUNCTION inventario.touch_updated_at();


--
-- Name: producto_variantes trg_touch_updated_at_variantes; Type: TRIGGER; Schema: inventario; Owner: postgres
--

CREATE TRIGGER trg_touch_updated_at_variantes BEFORE INSERT OR UPDATE ON inventario.producto_variantes FOR EACH ROW EXECUTE FUNCTION inventario.touch_updated_at();


--
-- Name: producto_variantes fk_pv_color; Type: FK CONSTRAINT; Schema: inventario; Owner: postgres
--

ALTER TABLE ONLY inventario.producto_variantes
    ADD CONSTRAINT fk_pv_color FOREIGN KEY (color_id) REFERENCES inventario.colores(id) ON DELETE RESTRICT;


--
-- Name: producto_variantes fk_pv_producto; Type: FK CONSTRAINT; Schema: inventario; Owner: postgres
--

ALTER TABLE ONLY inventario.producto_variantes
    ADD CONSTRAINT fk_pv_producto FOREIGN KEY (producto_id) REFERENCES inventario.productos(id) ON DELETE RESTRICT;


--
-- Name: producto_variantes fk_pv_talle; Type: FK CONSTRAINT; Schema: inventario; Owner: postgres
--

ALTER TABLE ONLY inventario.producto_variantes
    ADD CONSTRAINT fk_pv_talle FOREIGN KEY (talle_id) REFERENCES inventario.talles(id) ON DELETE SET NULL;


--
-- Name: reservas reservas_color_id_fkey; Type: FK CONSTRAINT; Schema: inventario; Owner: postgres
--

ALTER TABLE ONLY inventario.reservas
    ADD CONSTRAINT reservas_color_id_fkey FOREIGN KEY (color_id) REFERENCES inventario.colores(id) ON DELETE RESTRICT;


--
-- Name: reservas reservas_producto_id_fkey; Type: FK CONSTRAINT; Schema: inventario; Owner: postgres
--

ALTER TABLE ONLY inventario.reservas
    ADD CONSTRAINT reservas_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES inventario.productos(id) ON DELETE RESTRICT;


--
-- Name: reservas reservas_talle_id_fkey; Type: FK CONSTRAINT; Schema: inventario; Owner: postgres
--

ALTER TABLE ONLY inventario.reservas
    ADD CONSTRAINT reservas_talle_id_fkey FOREIGN KEY (talle_id) REFERENCES inventario.talles(id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict CaX8Z7NBQAFmxjUhZebEYZ1XZYTeZ7QLhImPWZgvIenAqQKUhvjT8zf8AhMsTmb

