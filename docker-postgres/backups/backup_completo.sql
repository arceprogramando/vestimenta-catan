--
-- PostgreSQL database dump
--

\restrict Shg5zG663OaLMYeUhJOdfyeV1Uh1GSQAPud6OxwtDxHffgSWWS28Le3R3yl7MwF

-- Dumped from database version 17.7
-- Dumped by pg_dump version 17.7

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
-- Name: estado_reserva; Type: TYPE; Schema: inventario; Owner: postgres
--

CREATE TYPE inventario.estado_reserva AS ENUM (
    'pendiente',
    'confirmado',
    'cancelado',
    'completado'
);


ALTER TYPE inventario.estado_reserva OWNER TO postgres;

--
-- Name: genero; Type: TYPE; Schema: inventario; Owner: postgres
--

CREATE TYPE inventario.genero AS ENUM (
    'mujer',
    'hombre',
    'ninios'
);


ALTER TYPE inventario.genero OWNER TO postgres;

--
-- Name: rol_usuario; Type: TYPE; Schema: inventario; Owner: postgres
--

CREATE TYPE inventario.rol_usuario AS ENUM (
    'user',
    'admin'
);


ALTER TYPE inventario.rol_usuario OWNER TO postgres;

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
-- Name: _prisma_migrations; Type: TABLE; Schema: inventario; Owner: postgres
--

CREATE TABLE inventario._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp(6) with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp(6) with time zone,
    started_at timestamp(6) with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE inventario._prisma_migrations OWNER TO postgres;

--
-- Name: audit_log; Type: TABLE; Schema: inventario; Owner: postgres
--

CREATE TABLE inventario.audit_log (
    id bigint NOT NULL,
    tabla character varying(100) NOT NULL,
    registro_id character varying(50) NOT NULL,
    accion character varying(20) NOT NULL,
    datos_antes json,
    datos_despues json,
    campos_modificados text[] NOT NULL,
    usuario_id bigint,
    usuario_email character varying(255),
    ip_address character varying(45),
    user_agent character varying(500),
    created_at timestamp(6) with time zone DEFAULT now() NOT NULL
);


ALTER TABLE inventario.audit_log OWNER TO postgres;

--
-- Name: audit_log_id_seq; Type: SEQUENCE; Schema: inventario; Owner: postgres
--

CREATE SEQUENCE inventario.audit_log_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE inventario.audit_log_id_seq OWNER TO postgres;

--
-- Name: audit_log_id_seq; Type: SEQUENCE OWNED BY; Schema: inventario; Owner: postgres
--

ALTER SEQUENCE inventario.audit_log_id_seq OWNED BY inventario.audit_log.id;


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
    delete_reason text,
    created_by text,
    updated_by text
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
    created_by text,
    updated_by text,
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
    is_active boolean DEFAULT true NOT NULL,
    precio numeric(10,2),
    created_by text,
    updated_by text
);


ALTER TABLE inventario.productos OWNER TO postgres;

--
-- Name: refresh_tokens; Type: TABLE; Schema: inventario; Owner: postgres
--

CREATE TABLE inventario.refresh_tokens (
    id bigint NOT NULL,
    token_hash character varying(255) NOT NULL,
    usuario_id bigint NOT NULL,
    expires_at timestamp(6) with time zone NOT NULL,
    revoked boolean DEFAULT false,
    revoked_at timestamp(6) with time zone,
    created_at timestamp(6) with time zone DEFAULT now(),
    user_agent character varying(500),
    ip_address character varying(45)
);


ALTER TABLE inventario.refresh_tokens OWNER TO postgres;

--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: inventario; Owner: postgres
--

CREATE SEQUENCE inventario.refresh_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE inventario.refresh_tokens_id_seq OWNER TO postgres;

--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: inventario; Owner: postgres
--

ALTER SEQUENCE inventario.refresh_tokens_id_seq OWNED BY inventario.refresh_tokens.id;


--
-- Name: reservas; Type: TABLE; Schema: inventario; Owner: postgres
--

CREATE TABLE inventario.reservas (
    id bigint NOT NULL,
    variante_id bigint NOT NULL,
    usuario_id bigint,
    cantidad integer NOT NULL,
    estado inventario.estado_reserva DEFAULT 'pendiente'::inventario.estado_reserva NOT NULL,
    fecha_reserva timestamp(6) with time zone DEFAULT now() NOT NULL,
    notas text,
    precio_unitario numeric(10,2),
    precio_total numeric(10,2),
    fecha_confirmacion timestamp(6) with time zone,
    confirmado_por text,
    fecha_cancelacion timestamp(6) with time zone,
    cancelado_por text,
    motivo_cancelacion text,
    telefono_contacto character varying(20),
    created_at timestamp(6) with time zone DEFAULT now() NOT NULL,
    created_by text,
    updated_at timestamp(6) with time zone DEFAULT now() NOT NULL,
    updated_by text,
    deleted_at timestamp(6) with time zone,
    deleted_by text,
    delete_reason text,
    is_active boolean DEFAULT true NOT NULL
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
    nombre text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp(6) with time zone,
    is_active boolean DEFAULT true NOT NULL,
    deleted_by text,
    delete_reason text,
    orden integer,
    created_by text,
    updated_by text
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
-- Name: usuarios; Type: TABLE; Schema: inventario; Owner: postgres
--

CREATE TABLE inventario.usuarios (
    id bigint NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255),
    nombre character varying(100),
    apellido character varying(100),
    rol inventario.rol_usuario DEFAULT 'user'::inventario.rol_usuario,
    google_id character varying(255),
    provider character varying(20) DEFAULT 'local'::character varying,
    avatar_url character varying(500),
    created_at timestamp(6) with time zone DEFAULT now(),
    created_by text,
    updated_at timestamp(6) with time zone DEFAULT now(),
    updated_by text,
    deleted_at timestamp(6) with time zone,
    deleted_by text,
    delete_reason text,
    is_active boolean DEFAULT true
);


ALTER TABLE inventario.usuarios OWNER TO postgres;

--
-- Name: usuarios_id_seq; Type: SEQUENCE; Schema: inventario; Owner: postgres
--

CREATE SEQUENCE inventario.usuarios_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE inventario.usuarios_id_seq OWNER TO postgres;

--
-- Name: usuarios_id_seq; Type: SEQUENCE OWNED BY; Schema: inventario; Owner: postgres
--

ALTER SEQUENCE inventario.usuarios_id_seq OWNED BY inventario.usuarios.id;


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
-- Name: audit_log id; Type: DEFAULT; Schema: inventario; Owner: postgres
--

ALTER TABLE ONLY inventario.audit_log ALTER COLUMN id SET DEFAULT nextval('inventario.audit_log_id_seq'::regclass);


--
-- Name: colores id; Type: DEFAULT; Schema: inventario; Owner: postgres
--

ALTER TABLE ONLY inventario.colores ALTER COLUMN id SET DEFAULT nextval('inventario.colores_id_seq'::regclass);


--
-- Name: producto_variantes id; Type: DEFAULT; Schema: inventario; Owner: postgres
--

ALTER TABLE ONLY inventario.producto_variantes ALTER COLUMN id SET DEFAULT nextval('inventario.producto_variantes_id_seq'::regclass);


--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: inventario; Owner: postgres
--

ALTER TABLE ONLY inventario.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('inventario.refresh_tokens_id_seq'::regclass);


--
-- Name: reservas id; Type: DEFAULT; Schema: inventario; Owner: postgres
--

ALTER TABLE ONLY inventario.reservas ALTER COLUMN id SET DEFAULT nextval('inventario.reservas_id_seq'::regclass);


--
-- Name: talles id; Type: DEFAULT; Schema: inventario; Owner: postgres
--

ALTER TABLE ONLY inventario.talles ALTER COLUMN id SET DEFAULT nextval('inventario.talles_id_seq'::regclass);


--
-- Name: usuarios id; Type: DEFAULT; Schema: inventario; Owner: postgres
--

ALTER TABLE ONLY inventario.usuarios ALTER COLUMN id SET DEFAULT nextval('inventario.usuarios_id_seq'::regclass);


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: inventario; Owner: postgres
--

COPY inventario._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
69784b72-183d-4df2-a72a-df8b4bba0f40	manual_sync_migration	2025-12-24 19:38:31.875299-03	20251208030206_add_auth_tables	Migración aplicada manualmente para sincronizar con base de datos existente	\N	2025-12-24 19:38:31.875299-03	1
\.


--
-- Data for Name: audit_log; Type: TABLE DATA; Schema: inventario; Owner: postgres
--

COPY inventario.audit_log (id, tabla, registro_id, accion, datos_antes, datos_despues, campos_modificados, usuario_id, usuario_email, ip_address, user_agent, created_at) FROM stdin;
\.


--
-- Data for Name: colores; Type: TABLE DATA; Schema: inventario; Owner: postgres
--

COPY inventario.colores (id, nombre, created_at, updated_at, deleted_at, is_active, deleted_by, delete_reason, created_by, updated_by) FROM stdin;
1	blanco	2025-08-16 00:26:14.084061-03	2025-08-16 00:26:14.084061-03	\N	t	\N	\N	\N	\N
2	negro	2025-08-16 00:26:14.084061-03	2025-08-16 00:26:14.084061-03	\N	t	\N	\N	\N	\N
3	gris	2025-08-16 00:26:14.084061-03	2025-08-16 00:26:14.084061-03	\N	t	\N	\N	\N	\N
4	azul	2025-08-16 00:26:14.084061-03	2025-08-16 00:26:14.084061-03	\N	t	\N	\N	\N	\N
\.


--
-- Data for Name: producto_variantes; Type: TABLE DATA; Schema: inventario; Owner: postgres
--

COPY inventario.producto_variantes (id, producto_id, talle_id, color_id, cantidad, created_at, updated_at, delete_reason, deleted_at, deleted_by, is_active, created_by, updated_by) FROM stdin;
1	3	15	1	6	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t	\N	\N
2	3	14	1	6	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t	\N	\N
3	3	13	1	6	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t	\N	\N
4	3	12	1	5	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t	\N	\N
5	3	11	1	6	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t	\N	\N
6	3	10	1	6	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t	\N	\N
7	1	8	1	5	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t	\N	\N
8	1	7	1	4	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t	\N	\N
9	1	6	1	3	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t	\N	\N
10	2	5	1	1	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t	\N	\N
11	2	4	1	3	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t	\N	\N
12	2	3	1	4	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t	\N	\N
13	2	2	1	6	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t	\N	\N
14	2	1	1	4	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t	\N	\N
15	4	\N	2	2	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t	\N	\N
16	5	\N	2	1	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t	\N	\N
17	3	15	2	4	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t	\N	\N
18	3	14	2	5	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t	\N	\N
19	3	13	2	4	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t	\N	\N
20	3	12	2	5	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t	\N	\N
21	3	11	2	4	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t	\N	\N
22	3	10	2	3	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t	\N	\N
23	1	9	2	11	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t	\N	\N
24	5	9	2	1	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t	\N	\N
25	1	8	2	3	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t	\N	\N
26	5	8	2	2	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t	\N	\N
27	1	7	2	4	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t	\N	\N
28	5	7	2	3	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t	\N	\N
29	2	5	2	5	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t	\N	\N
30	4	5	2	5	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t	\N	\N
31	2	4	2	5	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t	\N	\N
32	4	4	2	3	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t	\N	\N
33	2	3	2	4	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t	\N	\N
34	4	3	2	5	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t	\N	\N
35	2	2	2	5	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t	\N	\N
36	4	2	2	5	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t	\N	\N
37	2	1	2	0	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t	\N	\N
38	3	15	3	4	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t	\N	\N
39	3	11	3	5	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t	\N	\N
40	3	10	3	4	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t	\N	\N
41	1	9	3	3	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t	\N	\N
42	1	8	3	4	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t	\N	\N
43	1	7	3	2	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t	\N	\N
44	1	6	3	2	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t	\N	\N
45	2	5	3	2	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t	\N	\N
46	2	4	3	2	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t	\N	\N
47	2	3	3	2	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t	\N	\N
48	2	2	3	4	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t	\N	\N
49	2	1	3	1	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t	\N	\N
50	3	15	4	4	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t	\N	\N
51	3	14	4	5	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t	\N	\N
52	3	13	4	4	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t	\N	\N
53	3	12	4	4	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t	\N	\N
54	3	11	4	4	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t	\N	\N
55	3	10	4	2	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t	\N	\N
56	1	9	4	4	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t	\N	\N
57	1	8	4	2	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t	\N	\N
58	1	7	4	1	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t	\N	\N
59	2	5	4	3	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t	\N	\N
60	2	4	4	4	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t	\N	\N
61	2	3	4	2	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t	\N	\N
62	2	2	4	5	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t	\N	\N
63	2	1	4	0	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t	\N	\N
\.


--
-- Data for Name: productos; Type: TABLE DATA; Schema: inventario; Owner: postgres
--

COPY inventario.productos (id, nombre, descripcion, genero, thumbnail, created_at, updated_at, delete_reason, deleted_at, deleted_by, is_active, precio, created_by, updated_by) FROM stdin;
1	remera térmica	Remera térmica para mujer.	mujer	/images/products/remera-termica-mujer-1.jpeg	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t	\N	\N	\N
2	remera térmica	Remera térmica para hombre.	hombre	/images/products/remera-termica-hombre-1.jpeg	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t	\N	\N	\N
3	remera térmica	Remera térmica niños/unisex.	ninios	/images/products/remera-termica-ninios-1.jpeg	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t	\N	\N	\N
4	calza térmica	Calza térmica para hombre.	hombre	/images/products/calza-termica-hombre-1.png	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t	\N	\N	\N
5	calza térmica	Calza térmica para mujer.	mujer	/images/products/calza-termica-hombre-1.png	2025-08-16 01:21:58.219097-03	2025-08-16 01:21:58.219097-03	\N	\N	\N	t	\N	\N	\N
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: inventario; Owner: postgres
--

COPY inventario.refresh_tokens (id, token_hash, usuario_id, expires_at, revoked, revoked_at, created_at, user_agent, ip_address) FROM stdin;
1	0b63aa5789b452ff33ce3478938cba5e0d82054619e245c3973e3e1c1cfb1837	1	2025-12-31 19:23:55.393-03	f	\N	2025-12-24 19:23:55.395-03	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0	::1
\.


--
-- Data for Name: reservas; Type: TABLE DATA; Schema: inventario; Owner: postgres
--

COPY inventario.reservas (id, variante_id, usuario_id, cantidad, estado, fecha_reserva, notas, precio_unitario, precio_total, fecha_confirmacion, confirmado_por, fecha_cancelacion, cancelado_por, motivo_cancelacion, telefono_contacto, created_at, created_by, updated_at, updated_by, deleted_at, deleted_by, delete_reason, is_active) FROM stdin;
\.


--
-- Data for Name: talles; Type: TABLE DATA; Schema: inventario; Owner: postgres
--

COPY inventario.talles (id, nombre, created_at, updated_at, deleted_at, is_active, deleted_by, delete_reason, orden, created_by, updated_by) FROM stdin;
1	S	2025-08-16 00:26:14.084061-03	2025-08-16 00:26:14.084061-03	\N	t	\N	\N	\N	\N	\N
2	M	2025-08-16 00:26:14.084061-03	2025-08-16 00:26:14.084061-03	\N	t	\N	\N	\N	\N	\N
3	L	2025-08-16 00:26:14.084061-03	2025-08-16 00:26:14.084061-03	\N	t	\N	\N	\N	\N	\N
4	XL	2025-08-16 00:26:14.084061-03	2025-08-16 00:26:14.084061-03	\N	t	\N	\N	\N	\N	\N
5	XXL	2025-08-16 00:26:14.084061-03	2025-08-16 00:26:14.084061-03	\N	t	\N	\N	\N	\N	\N
6	1	2025-08-16 00:26:14.084061-03	2025-08-16 00:26:14.084061-03	\N	t	\N	\N	\N	\N	\N
7	2	2025-08-16 00:26:14.084061-03	2025-08-16 00:26:14.084061-03	\N	t	\N	\N	\N	\N	\N
8	3	2025-08-16 00:26:14.084061-03	2025-08-16 00:26:14.084061-03	\N	t	\N	\N	\N	\N	\N
9	4	2025-08-16 00:26:14.084061-03	2025-08-16 00:26:14.084061-03	\N	t	\N	\N	\N	\N	\N
10	6	2025-08-16 00:26:14.084061-03	2025-08-16 00:26:14.084061-03	\N	t	\N	\N	\N	\N	\N
11	8	2025-08-16 00:26:14.084061-03	2025-08-16 00:26:14.084061-03	\N	t	\N	\N	\N	\N	\N
12	10	2025-08-16 00:26:14.084061-03	2025-08-16 00:26:14.084061-03	\N	t	\N	\N	\N	\N	\N
13	12	2025-08-16 00:26:14.084061-03	2025-08-16 00:26:14.084061-03	\N	t	\N	\N	\N	\N	\N
14	14	2025-08-16 00:26:14.084061-03	2025-08-16 00:26:14.084061-03	\N	t	\N	\N	\N	\N	\N
15	16	2025-08-16 00:26:14.084061-03	2025-08-16 00:26:14.084061-03	\N	t	\N	\N	\N	\N	\N
\.


--
-- Data for Name: usuarios; Type: TABLE DATA; Schema: inventario; Owner: postgres
--

COPY inventario.usuarios (id, email, password_hash, nombre, apellido, rol, google_id, provider, avatar_url, created_at, created_by, updated_at, updated_by, deleted_at, deleted_by, delete_reason, is_active) FROM stdin;
1	arceprogramando@gmail.com	\N	Felipe Antonio	Aleman Arce	user	100571916906426039347	google	https://lh3.googleusercontent.com/a/ACg8ocKh97a9IcpfxsgPhACq_BQn1-lJRd7nzHms0iFnTm-qyH2xn1L_=s96-c	2025-12-24 19:23:55.325-03	\N	2025-12-24 19:23:55.325-03	\N	\N	\N	\N	t
\.


--
-- Name: audit_log_id_seq; Type: SEQUENCE SET; Schema: inventario; Owner: postgres
--

SELECT pg_catalog.setval('inventario.audit_log_id_seq', 1, false);


--
-- Name: colores_id_seq; Type: SEQUENCE SET; Schema: inventario; Owner: postgres
--

SELECT pg_catalog.setval('inventario.colores_id_seq', 12, true);


--
-- Name: producto_variantes_id_seq; Type: SEQUENCE SET; Schema: inventario; Owner: postgres
--

SELECT pg_catalog.setval('inventario.producto_variantes_id_seq', 63, true);


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: inventario; Owner: postgres
--

SELECT pg_catalog.setval('inventario.refresh_tokens_id_seq', 1, true);


--
-- Name: reservas_id_seq; Type: SEQUENCE SET; Schema: inventario; Owner: postgres
--

SELECT pg_catalog.setval('inventario.reservas_id_seq', 1, false);


--
-- Name: talles_id_seq; Type: SEQUENCE SET; Schema: inventario; Owner: postgres
--

SELECT pg_catalog.setval('inventario.talles_id_seq', 30, true);


--
-- Name: usuarios_id_seq; Type: SEQUENCE SET; Schema: inventario; Owner: postgres
--

SELECT pg_catalog.setval('inventario.usuarios_id_seq', 1, true);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: inventario; Owner: postgres
--

ALTER TABLE ONLY inventario._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: audit_log audit_log_pkey; Type: CONSTRAINT; Schema: inventario; Owner: postgres
--

ALTER TABLE ONLY inventario.audit_log
    ADD CONSTRAINT audit_log_pkey PRIMARY KEY (id);


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
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: inventario; Owner: postgres
--

ALTER TABLE ONLY inventario.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: reservas reservas_pkey; Type: CONSTRAINT; Schema: inventario; Owner: postgres
--

ALTER TABLE ONLY inventario.reservas
    ADD CONSTRAINT reservas_pkey PRIMARY KEY (id);


--
-- Name: talles talles_label_key; Type: CONSTRAINT; Schema: inventario; Owner: postgres
--

ALTER TABLE ONLY inventario.talles
    ADD CONSTRAINT talles_label_key UNIQUE (nombre);


--
-- Name: talles talles_pkey; Type: CONSTRAINT; Schema: inventario; Owner: postgres
--

ALTER TABLE ONLY inventario.talles
    ADD CONSTRAINT talles_pkey PRIMARY KEY (id);


--
-- Name: usuarios usuarios_email_key; Type: CONSTRAINT; Schema: inventario; Owner: postgres
--

ALTER TABLE ONLY inventario.usuarios
    ADD CONSTRAINT usuarios_email_key UNIQUE (email);


--
-- Name: usuarios usuarios_google_id_key; Type: CONSTRAINT; Schema: inventario; Owner: postgres
--

ALTER TABLE ONLY inventario.usuarios
    ADD CONSTRAINT usuarios_google_id_key UNIQUE (google_id);


--
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: inventario; Owner: postgres
--

ALTER TABLE ONLY inventario.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- Name: producto_variantes ux_prod_talle_color; Type: CONSTRAINT; Schema: inventario; Owner: postgres
--

ALTER TABLE ONLY inventario.producto_variantes
    ADD CONSTRAINT ux_prod_talle_color UNIQUE (producto_id, talle_id, color_id);


--
-- Name: ix_audit_accion; Type: INDEX; Schema: inventario; Owner: postgres
--

CREATE INDEX ix_audit_accion ON inventario.audit_log USING btree (accion);


--
-- Name: ix_audit_fecha; Type: INDEX; Schema: inventario; Owner: postgres
--

CREATE INDEX ix_audit_fecha ON inventario.audit_log USING btree (created_at);


--
-- Name: ix_audit_tabla_registro; Type: INDEX; Schema: inventario; Owner: postgres
--

CREATE INDEX ix_audit_tabla_registro ON inventario.audit_log USING btree (tabla, registro_id);


--
-- Name: ix_audit_usuario; Type: INDEX; Schema: inventario; Owner: postgres
--

CREATE INDEX ix_audit_usuario ON inventario.audit_log USING btree (usuario_id);


--
-- Name: ix_colores_active; Type: INDEX; Schema: inventario; Owner: postgres
--

CREATE INDEX ix_colores_active ON inventario.colores USING btree (is_active);


--
-- Name: ix_productos_active; Type: INDEX; Schema: inventario; Owner: postgres
--

CREATE INDEX ix_productos_active ON inventario.productos USING btree (is_active);


--
-- Name: ix_productos_genero; Type: INDEX; Schema: inventario; Owner: postgres
--

CREATE INDEX ix_productos_genero ON inventario.productos USING btree (genero);


--
-- Name: ix_refresh_tokens_hash; Type: INDEX; Schema: inventario; Owner: postgres
--

CREATE INDEX ix_refresh_tokens_hash ON inventario.refresh_tokens USING btree (token_hash);


--
-- Name: ix_refresh_tokens_usuario; Type: INDEX; Schema: inventario; Owner: postgres
--

CREATE INDEX ix_refresh_tokens_usuario ON inventario.refresh_tokens USING btree (usuario_id);


--
-- Name: ix_refresh_tokens_usuario_revoked; Type: INDEX; Schema: inventario; Owner: postgres
--

CREATE INDEX ix_refresh_tokens_usuario_revoked ON inventario.refresh_tokens USING btree (usuario_id, revoked);


--
-- Name: ix_reservas_active; Type: INDEX; Schema: inventario; Owner: postgres
--

CREATE INDEX ix_reservas_active ON inventario.reservas USING btree (is_active);


--
-- Name: ix_reservas_estado; Type: INDEX; Schema: inventario; Owner: postgres
--

CREATE INDEX ix_reservas_estado ON inventario.reservas USING btree (estado);


--
-- Name: ix_reservas_fecha; Type: INDEX; Schema: inventario; Owner: postgres
--

CREATE INDEX ix_reservas_fecha ON inventario.reservas USING btree (fecha_reserva);


--
-- Name: ix_reservas_usuario; Type: INDEX; Schema: inventario; Owner: postgres
--

CREATE INDEX ix_reservas_usuario ON inventario.reservas USING btree (usuario_id);


--
-- Name: ix_reservas_variante; Type: INDEX; Schema: inventario; Owner: postgres
--

CREATE INDEX ix_reservas_variante ON inventario.reservas USING btree (variante_id);


--
-- Name: ix_talles_active; Type: INDEX; Schema: inventario; Owner: postgres
--

CREATE INDEX ix_talles_active ON inventario.talles USING btree (is_active);


--
-- Name: ix_usuarios_active; Type: INDEX; Schema: inventario; Owner: postgres
--

CREATE INDEX ix_usuarios_active ON inventario.usuarios USING btree (is_active);


--
-- Name: ix_usuarios_email; Type: INDEX; Schema: inventario; Owner: postgres
--

CREATE INDEX ix_usuarios_email ON inventario.usuarios USING btree (email);


--
-- Name: ix_usuarios_google_id; Type: INDEX; Schema: inventario; Owner: postgres
--

CREATE INDEX ix_usuarios_google_id ON inventario.usuarios USING btree (google_id);


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
-- Name: refresh_tokens refresh_tokens_usuario_id_fkey; Type: FK CONSTRAINT; Schema: inventario; Owner: postgres
--

ALTER TABLE ONLY inventario.refresh_tokens
    ADD CONSTRAINT refresh_tokens_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES inventario.usuarios(id) ON DELETE CASCADE;


--
-- Name: reservas reservas_usuario_id_fkey; Type: FK CONSTRAINT; Schema: inventario; Owner: postgres
--

ALTER TABLE ONLY inventario.reservas
    ADD CONSTRAINT reservas_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES inventario.usuarios(id) ON DELETE SET NULL;


--
-- Name: reservas reservas_variante_id_fkey; Type: FK CONSTRAINT; Schema: inventario; Owner: postgres
--

ALTER TABLE ONLY inventario.reservas
    ADD CONSTRAINT reservas_variante_id_fkey FOREIGN KEY (variante_id) REFERENCES inventario.producto_variantes(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict Shg5zG663OaLMYeUhJOdfyeV1Uh1GSQAPud6OxwtDxHffgSWWS28Le3R3yl7MwF

