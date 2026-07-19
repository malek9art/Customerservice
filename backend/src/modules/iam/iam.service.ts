import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class IamService {
  constructor(private prisma: PrismaService) {}

  async validatePermission(employeeId: string, permission: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
    });
    if (!employee || !employee.isActive) return false;
    const permissions = Array.isArray(employee.permissions)
      ? employee.permissions
      : [];
    return (
      employee.role === 'ADMIN' ||
      permissions.includes('*') ||
      permissions.includes(permission)
    );
  }
}
