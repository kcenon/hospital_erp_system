-- CreateTable: users
CREATE TABLE "public"."users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "employee_id" VARCHAR(20) NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255),
    "phone" VARCHAR(20),
    "department" VARCHAR(100),
    "position" VARCHAR(100),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMPTZ,
    "password_changed_at" TIMESTAMPTZ,
    "failed_login_count" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable: roles
CREATE TABLE "public"."roles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "level" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable: permissions
CREATE TABLE "public"."permissions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(100) NOT NULL,
    "resource" VARCHAR(50) NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable: user_roles
CREATE TABLE "public"."user_roles" (
    "user_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "assigned_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assigned_by" UUID,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id", "role_id")
);

-- CreateTable: role_permissions
CREATE TABLE "public"."role_permissions" (
    "role_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id", "permission_id")
);

-- CreateIndex: users_employee_id_key
CREATE UNIQUE INDEX "users_employee_id_key" ON "public"."users"("employee_id");

-- CreateIndex: users_username_key
CREATE UNIQUE INDEX "users_username_key" ON "public"."users"("username");

-- CreateIndex: users_username_idx
CREATE INDEX "users_username_idx" ON "public"."users"("username");

-- CreateIndex: users_employee_id_idx
CREATE INDEX "users_employee_id_idx" ON "public"."users"("employee_id");

-- CreateIndex: users_is_active_idx
CREATE INDEX "users_is_active_idx" ON "public"."users"("is_active");

-- CreateIndex: users_deleted_at_idx
CREATE INDEX "users_deleted_at_idx" ON "public"."users"("deleted_at");

-- CreateIndex: roles_code_key
CREATE UNIQUE INDEX "roles_code_key" ON "public"."roles"("code");

-- CreateIndex: roles_code_idx
CREATE INDEX "roles_code_idx" ON "public"."roles"("code");

-- CreateIndex: roles_is_active_idx
CREATE INDEX "roles_is_active_idx" ON "public"."roles"("is_active");

-- CreateIndex: permissions_code_key
CREATE UNIQUE INDEX "permissions_code_key" ON "public"."permissions"("code");

-- CreateIndex: permissions_resource_idx
CREATE INDEX "permissions_resource_idx" ON "public"."permissions"("resource");

-- CreateIndex: permissions_code_idx
CREATE INDEX "permissions_code_idx" ON "public"."permissions"("code");

-- CreateIndex: user_roles_user_id_idx
CREATE INDEX "user_roles_user_id_idx" ON "public"."user_roles"("user_id");

-- CreateIndex: user_roles_role_id_idx
CREATE INDEX "user_roles_role_id_idx" ON "public"."user_roles"("role_id");

-- CreateIndex: role_permissions_role_id_idx
CREATE INDEX "role_permissions_role_id_idx" ON "public"."role_permissions"("role_id");

-- CreateIndex: role_permissions_permission_id_idx
CREATE INDEX "role_permissions_permission_id_idx" ON "public"."role_permissions"("permission_id");

-- AddForeignKey: user_roles -> users
ALTER TABLE "public"."user_roles" ADD CONSTRAINT "user_roles_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: user_roles -> roles
ALTER TABLE "public"."user_roles" ADD CONSTRAINT "user_roles_role_id_fkey"
    FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: user_roles -> users (assigned_by)
ALTER TABLE "public"."user_roles" ADD CONSTRAINT "user_roles_assigned_by_fkey"
    FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: role_permissions -> roles
ALTER TABLE "public"."role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey"
    FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: role_permissions -> permissions
ALTER TABLE "public"."role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey"
    FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- Function: updated_at trigger for public schema
CREATE OR REPLACE FUNCTION "public".update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON "public"."users"
    FOR EACH ROW EXECUTE FUNCTION "public".update_updated_at_column();

CREATE TRIGGER update_roles_updated_at
    BEFORE UPDATE ON "public"."roles"
    FOR EACH ROW EXECUTE FUNCTION "public".update_updated_at_column();

-- CreateView: user_permissions (for permission lookup)
CREATE OR REPLACE VIEW "public"."user_permissions" AS
SELECT
    u.id AS user_id,
    u.username,
    u.name AS user_name,
    r.code AS role_code,
    r.name AS role_name,
    r.level AS role_level,
    p.code AS permission_code,
    p.resource,
    p.action
FROM "public"."users" u
JOIN "public"."user_roles" ur ON ur.user_id = u.id
JOIN "public"."roles" r ON r.id = ur.role_id AND r.is_active = true
JOIN "public"."role_permissions" rp ON rp.role_id = r.id
JOIN "public"."permissions" p ON p.id = rp.permission_id
WHERE u.is_active = true AND u.deleted_at IS NULL;
