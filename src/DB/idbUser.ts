// NOTE: All DB worker messages should use { action: ... } not { type: ... } for action property.
// idbUser.ts

export class User {
  constructor(
    public id: string,
    public name: string,
    public email: string
  ) {}
}