import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, FindOptionsWhere } from 'typeorm';
import { Vehiculo, EstadoVehiculo } from '../entities/vehiculo.entity';
import { CreateVehiculoDto } from '../dto/create-vehiculo.dto';
import { UpdateVehiculoDto } from '../dto/update-vehiculo.dto';

export type ListVehiculosQuery = {
  q?: string; // búsqueda por placa
  estado?: EstadoVehiculo; // filtro por estado (enum tipado)
  page?: number; // página (1..n)
  limit?: number; // tamaño de página
};

@Injectable()
export class VehiculosService {
  constructor(
    @InjectRepository(Vehiculo)
    private readonly vehiculosRepo: Repository<Vehiculo>,
  ) {}

  async findAll(params: ListVehiculosQuery = {}): Promise<{
    total: number;
    page: number;
    limit: number;
    items: Vehiculo[];
  }> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;

    const where: FindOptionsWhere<Vehiculo> = {
      ...(params.q ? { placa: ILike(`%${params.q}%`) } : {}),
      ...(params.estado ? { estado: params.estado } : {}),
    };

    const [items, total] = await this.vehiculosRepo.findAndCount({
      where,
      order: { creadoEn: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { total, page, limit, items };
  }
  async getById(id: string) {
    return this.findOneOrThrow(id);
  }

  async create(payload: CreateVehiculoDto) {
    try {
      const duplicated = await this.vehiculosRepo.findOne({
        where: { placa: payload.placa },
      });
      if (duplicated) {
        throw new ConflictException('La placa ya existe');
      }

      const entity = this.vehiculosRepo.create(payload);
      const saved = await this.vehiculosRepo.save(entity);
      // devolvemos el registro actualizado desde DB
      return this.findOneOrThrow(saved.id);
    } catch (err) {
      // Si ya es una excepción conocida, la repropagamos
      if (err instanceof ConflictException) throw err;
      throw new BadRequestException('Error creando el vehículo');
    }
  }

  async update(id: string, changes: UpdateVehiculoDto) {
    try {
      const current = await this.findOneOrThrow(id);

      // Validar cambio de placa
      if (changes.placa !== current.placa) {
        const duplicated = await this.vehiculosRepo.findOne({
          where: { placa: changes.placa },
        });
        if (duplicated) {
          throw new ConflictException('La placa ya existe');
        }
      }

      const merged = this.vehiculosRepo.merge(current, changes);
      const saved = await this.vehiculosRepo.save(merged);
      return saved;
    } catch (err) {
      if (err instanceof NotFoundException || err instanceof ConflictException)
        throw err;
      throw new BadRequestException('Error actualizando el vehículo');
    }
  }

  async delete(id: string) {
    try {
      const current = await this.findOneOrThrow(id);
      await this.vehiculosRepo.remove(current);
      return { message: 'Vehículo eliminado', id };
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
      throw new BadRequestException('Error eliminando el vehículo');
    }
  }

  async findByPlaca(placa: string) {
    return this.vehiculosRepo.findOne({ where: { placa } });
  }

  private async findOneOrThrow(id: string) {
    const vehiculo = await this.vehiculosRepo.findOne({ where: { id } });
    if (!vehiculo) {
      throw new NotFoundException(`Vehículo con id ${id} no encontrado`);
    }
    return vehiculo;
  }
}
