-- CreateSchema: room
CREATE SCHEMA IF NOT EXISTS "room";

-- CreateEnum: RoomType
CREATE TYPE "room"."RoomType" AS ENUM ('WARD', 'ICU', 'ISOLATION', 'VIP', 'EMERGENCY');

-- CreateEnum: BedStatus
CREATE TYPE "room"."BedStatus" AS ENUM ('EMPTY', 'OCCUPIED', 'RESERVED', 'MAINTENANCE');

-- CreateTable: buildings
CREATE TABLE "room"."buildings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(20) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "address" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "buildings_pkey" PRIMARY KEY ("id")
);

-- CreateTable: floors
CREATE TABLE "room"."floors" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "building_id" UUID NOT NULL,
    "floor_number" INTEGER NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "department" VARCHAR(100),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "floors_pkey" PRIMARY KEY ("id")
);

-- CreateTable: rooms
CREATE TABLE "room"."rooms" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "floor_id" UUID NOT NULL,
    "room_number" VARCHAR(20) NOT NULL,
    "name" VARCHAR(100),
    "room_type" "room"."RoomType" NOT NULL,
    "bed_count" INTEGER NOT NULL DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable: beds
CREATE TABLE "room"."beds" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "room_id" UUID NOT NULL,
    "bed_number" VARCHAR(10) NOT NULL,
    "status" "room"."BedStatus" NOT NULL DEFAULT 'EMPTY',
    "current_admission_id" UUID,
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "beds_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: buildings_code_key
CREATE UNIQUE INDEX "buildings_code_key" ON "room"."buildings"("code");

-- CreateIndex: floors_building_id_floor_number_key
CREATE UNIQUE INDEX "floors_building_id_floor_number_key" ON "room"."floors"("building_id", "floor_number");

-- CreateIndex: floors_building_id_idx
CREATE INDEX "floors_building_id_idx" ON "room"."floors"("building_id");

-- CreateIndex: rooms_floor_id_room_number_key
CREATE UNIQUE INDEX "rooms_floor_id_room_number_key" ON "room"."rooms"("floor_id", "room_number");

-- CreateIndex: rooms_floor_id_idx
CREATE INDEX "rooms_floor_id_idx" ON "room"."rooms"("floor_id");

-- CreateIndex: beds_room_id_bed_number_key
CREATE UNIQUE INDEX "beds_room_id_bed_number_key" ON "room"."beds"("room_id", "bed_number");

-- CreateIndex: beds_room_id_idx
CREATE INDEX "beds_room_id_idx" ON "room"."beds"("room_id");

-- CreateIndex: beds_status_idx
CREATE INDEX "beds_status_idx" ON "room"."beds"("status");

-- AddForeignKey: floors -> buildings
ALTER TABLE "room"."floors" ADD CONSTRAINT "floors_building_id_fkey"
    FOREIGN KEY ("building_id") REFERENCES "room"."buildings"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: rooms -> floors
ALTER TABLE "room"."rooms" ADD CONSTRAINT "rooms_floor_id_fkey"
    FOREIGN KEY ("floor_id") REFERENCES "room"."floors"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: beds -> rooms
ALTER TABLE "room"."beds" ADD CONSTRAINT "beds_room_id_fkey"
    FOREIGN KEY ("room_id") REFERENCES "room"."rooms"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateView: room_dashboard (for real-time status board)
CREATE OR REPLACE VIEW "room"."room_dashboard" AS
SELECT
    f.id AS floor_id,
    f.name AS floor_name,
    f.department,
    r.id AS room_id,
    r.room_number,
    r.room_type,
    r.bed_count,
    COUNT(b.id) FILTER (WHERE b.status = 'EMPTY' AND b.is_active = true) AS empty_beds,
    COUNT(b.id) FILTER (WHERE b.status = 'OCCUPIED' AND b.is_active = true) AS occupied_beds,
    COUNT(b.id) FILTER (WHERE b.status = 'RESERVED' AND b.is_active = true) AS reserved_beds,
    COUNT(b.id) FILTER (WHERE b.status = 'MAINTENANCE' AND b.is_active = true) AS maintenance_beds
FROM "room"."floors" f
JOIN "room"."rooms" r ON r.floor_id = f.id
LEFT JOIN "room"."beds" b ON b.room_id = r.id
WHERE r.is_active = true AND f.is_active = true
GROUP BY f.id, f.name, f.department, r.id, r.room_number, r.room_type, r.bed_count;

-- CreateView: building_summary (for building-level statistics)
CREATE OR REPLACE VIEW "room"."building_summary" AS
SELECT
    bld.id AS building_id,
    bld.code AS building_code,
    bld.name AS building_name,
    COUNT(DISTINCT f.id) AS total_floors,
    COUNT(DISTINCT r.id) AS total_rooms,
    COUNT(b.id) FILTER (WHERE b.is_active = true) AS total_beds,
    COUNT(b.id) FILTER (WHERE b.status = 'EMPTY' AND b.is_active = true) AS available_beds,
    COUNT(b.id) FILTER (WHERE b.status = 'OCCUPIED' AND b.is_active = true) AS occupied_beds
FROM "room"."buildings" bld
LEFT JOIN "room"."floors" f ON f.building_id = bld.id AND f.is_active = true
LEFT JOIN "room"."rooms" r ON r.floor_id = f.id AND r.is_active = true
LEFT JOIN "room"."beds" b ON b.room_id = r.id
WHERE bld.is_active = true
GROUP BY bld.id, bld.code, bld.name;

-- Function: updated_at trigger
CREATE OR REPLACE FUNCTION "room".update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_buildings_updated_at
    BEFORE UPDATE ON "room"."buildings"
    FOR EACH ROW EXECUTE FUNCTION "room".update_updated_at_column();

CREATE TRIGGER update_floors_updated_at
    BEFORE UPDATE ON "room"."floors"
    FOR EACH ROW EXECUTE FUNCTION "room".update_updated_at_column();

CREATE TRIGGER update_rooms_updated_at
    BEFORE UPDATE ON "room"."rooms"
    FOR EACH ROW EXECUTE FUNCTION "room".update_updated_at_column();

CREATE TRIGGER update_beds_updated_at
    BEFORE UPDATE ON "room"."beds"
    FOR EACH ROW EXECUTE FUNCTION "room".update_updated_at_column();
