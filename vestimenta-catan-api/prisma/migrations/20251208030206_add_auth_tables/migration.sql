-- CreateEnum
CREATE TYPE "public"."genero" AS ENUM ('mujer', 'hombre', 'niños unisex');

-- CreateEnum
CREATE TYPE "public"."rol_usuario" AS ENUM ('user', 'admin');

-- CreateTable
CREATE TABLE "public"."colores" (
    "id" BIGSERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_by" TEXT,
    "delete_reason" TEXT,

    CONSTRAINT "colores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."producto_variantes" (
    "id" BIGSERIAL NOT NULL,
    "producto_id" INTEGER NOT NULL,
    "talle_id" BIGINT,
    "color_id" BIGINT NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "delete_reason" TEXT,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "producto_variantes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."productos" (
    "id" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "genero" "public"."genero" NOT NULL,
    "thumbnail" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "delete_reason" TEXT,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "productos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."reservas" (
    "id" BIGSERIAL NOT NULL,
    "producto_id" INTEGER NOT NULL,
    "talle_id" BIGINT,
    "color_id" BIGINT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "estado" TEXT NOT NULL,
    "fecha_reserva" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "delete_reason" TEXT,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "usuario_id" BIGINT,

    CONSTRAINT "reservas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."talles" (
    "id" BIGSERIAL NOT NULL,
    "nombre_talle" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_by" TEXT,
    "delete_reason" TEXT,

    CONSTRAINT "talles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."usuarios" (
    "id" BIGSERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "nombre" VARCHAR(100),
    "apellido" VARCHAR(100),
    "rol" "public"."rol_usuario" NOT NULL DEFAULT 'user',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" TEXT,
    "delete_reason" TEXT,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."refresh_tokens" (
    "id" BIGSERIAL NOT NULL,
    "token_hash" VARCHAR(255) NOT NULL,
    "usuario_id" BIGINT NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "revoked_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_agent" VARCHAR(500),
    "ip_address" VARCHAR(45),

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "colores_nombre_key" ON "public"."colores"("nombre");

-- CreateIndex
CREATE INDEX "ix_colores_active" ON "public"."colores"("is_active");

-- CreateIndex
CREATE INDEX "ix_var_active" ON "public"."producto_variantes"("is_active");

-- CreateIndex
CREATE INDEX "ix_var_color" ON "public"."producto_variantes"("color_id");

-- CreateIndex
CREATE INDEX "ix_var_combo" ON "public"."producto_variantes"("producto_id", "talle_id", "color_id");

-- CreateIndex
CREATE INDEX "ix_var_prod" ON "public"."producto_variantes"("producto_id");

-- CreateIndex
CREATE INDEX "ix_var_talle" ON "public"."producto_variantes"("talle_id");

-- CreateIndex
CREATE UNIQUE INDEX "ux_prod_talle_color" ON "public"."producto_variantes"("producto_id", "talle_id", "color_id");

-- CreateIndex
CREATE INDEX "ix_productos_active" ON "public"."productos"("is_active");

-- CreateIndex
CREATE INDEX "ix_reservas_active" ON "public"."reservas"("is_active");

-- CreateIndex
CREATE INDEX "ix_reservas_fecha" ON "public"."reservas"("fecha_reserva");

-- CreateIndex
CREATE INDEX "ix_reservas_usuario" ON "public"."reservas"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "talles_label_key" ON "public"."talles"("nombre_talle");

-- CreateIndex
CREATE INDEX "ix_talles_active" ON "public"."talles"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "public"."usuarios"("email");

-- CreateIndex
CREATE INDEX "ix_usuarios_email" ON "public"."usuarios"("email");

-- CreateIndex
CREATE INDEX "ix_usuarios_active" ON "public"."usuarios"("is_active");

-- CreateIndex
CREATE INDEX "ix_refresh_tokens_hash" ON "public"."refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "ix_refresh_tokens_usuario" ON "public"."refresh_tokens"("usuario_id");

-- CreateIndex
CREATE INDEX "ix_refresh_tokens_usuario_revoked" ON "public"."refresh_tokens"("usuario_id", "revoked");

-- AddForeignKey
ALTER TABLE "public"."producto_variantes" ADD CONSTRAINT "fk_pv_color" FOREIGN KEY ("color_id") REFERENCES "public"."colores"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."producto_variantes" ADD CONSTRAINT "fk_pv_producto" FOREIGN KEY ("producto_id") REFERENCES "public"."productos"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."producto_variantes" ADD CONSTRAINT "fk_pv_talle" FOREIGN KEY ("talle_id") REFERENCES "public"."talles"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."reservas" ADD CONSTRAINT "reservas_color_id_fkey" FOREIGN KEY ("color_id") REFERENCES "public"."colores"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."reservas" ADD CONSTRAINT "reservas_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "public"."productos"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."reservas" ADD CONSTRAINT "reservas_talle_id_fkey" FOREIGN KEY ("talle_id") REFERENCES "public"."talles"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."reservas" ADD CONSTRAINT "reservas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."refresh_tokens" ADD CONSTRAINT "refresh_tokens_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
