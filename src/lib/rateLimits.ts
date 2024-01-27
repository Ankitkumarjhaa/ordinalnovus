interface RateLimits {
  free: number;
  silver: number;
  gold: number;
  bitcoin: number;
  admin: number;
}

export type UserType = keyof RateLimits;

const rateLimits: RateLimits = {
  free: 2000,
  silver: 5000,
  gold: 30000,
  bitcoin: 100000,
  admin: 10000000,
};

export default rateLimits;
