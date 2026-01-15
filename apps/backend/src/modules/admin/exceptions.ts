import { HttpException, HttpStatus, NotFoundException, ConflictException } from '@nestjs/common';

/**
 * Exception thrown when a user is not found
 */
export class UserNotFoundException extends NotFoundException {
  constructor(identifier: string) {
    super(`User not found: ${identifier}`);
  }
}

/**
 * Exception thrown when attempting to create a user with duplicate username
 */
export class DuplicateUsernameException extends ConflictException {
  constructor(username: string) {
    super(`Username already exists: ${username}`);
  }
}

/**
 * Exception thrown when attempting to create a user with duplicate employee ID
 */
export class DuplicateEmployeeIdException extends ConflictException {
  constructor(employeeId: string) {
    super(`Employee ID already exists: ${employeeId}`);
  }
}

/**
 * Exception thrown when a role is not found
 */
export class RoleNotFoundException extends NotFoundException {
  constructor(identifier: string) {
    super(`Role not found: ${identifier}`);
  }
}

/**
 * Exception thrown when attempting to assign a role that user already has
 */
export class RoleAlreadyAssignedException extends ConflictException {
  constructor(userId: string, roleId: string) {
    super(`User ${userId} already has role ${roleId}`);
  }
}

/**
 * Exception thrown when attempting to remove a role that user doesn't have
 */
export class RoleNotAssignedException extends NotFoundException {
  constructor(userId: string, roleId: string) {
    super(`User ${userId} does not have role ${roleId}`);
  }
}

/**
 * Exception thrown when attempting to deactivate the last admin user
 */
export class CannotDeactivateLastAdminException extends HttpException {
  constructor() {
    super('Cannot deactivate the last active admin user', HttpStatus.FORBIDDEN);
  }
}

/**
 * Exception thrown when attempting to remove the last admin role from a user
 */
export class CannotRemoveLastAdminRoleException extends HttpException {
  constructor() {
    super('Cannot remove the last admin role from the system', HttpStatus.FORBIDDEN);
  }
}
