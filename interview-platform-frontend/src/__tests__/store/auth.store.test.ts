import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '@/store/auth.store';

describe('Auth Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    const { logout } = useAuthStore.getState();
    logout();
    localStorage.clear();
  });

  it('should initialize with null tokens', () => {
    const state = useAuthStore.getState();
    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
    expect(state.user).toBeNull();
  });

  it('should set auth tokens', () => {
    const { setAuthTokens } = useAuthStore.getState();
    setAuthTokens({ accessToken: 'test-token', refreshToken: 'refresh-token' });

    const state = useAuthStore.getState();
    expect(state.accessToken).toBe('test-token');
    expect(state.refreshToken).toBe('refresh-token');
  });

  it('should persist tokens to localStorage', () => {
    const { setAuthTokens } = useAuthStore.getState();
    setAuthTokens({ accessToken: 'stored-token', refreshToken: 'stored-refresh' });

    expect(localStorage.getItem('access_token')).toBe('stored-token');
    expect(localStorage.getItem('refresh_token')).toBe('stored-refresh');
  });

  it('should set user data', () => {
    const { setUser } = useAuthStore.getState();
    const user = {
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@test.com',
      roles: ['ADMIN'],
    };
    setUser(user);

    const state = useAuthStore.getState();
    expect(state.user).toEqual(user);
    expect(localStorage.getItem('user')).toBe(JSON.stringify(user));
  });

  it('should report isAuthenticated correctly', () => {
    const { setAuthTokens, isAuthenticated } = useAuthStore.getState();
    expect(isAuthenticated()).toBe(false);

    setAuthTokens({ accessToken: 'token' });
    expect(useAuthStore.getState().isAuthenticated()).toBe(true);
  });

  it('should clear all data on logout', () => {
    const { setAuthTokens, setUser, logout } = useAuthStore.getState();
    setAuthTokens({ accessToken: 'token', refreshToken: 'refresh' });
    setUser({ id: '1', email: 'test@test.com', roles: ['USER'] });

    logout();

    const state = useAuthStore.getState();
    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
    expect(state.user).toBeNull();
    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });

  it('should remove token from localStorage when set to null', () => {
    const { setAuthTokens } = useAuthStore.getState();
    setAuthTokens({ accessToken: 'token' });
    expect(localStorage.getItem('access_token')).toBe('token');

    setAuthTokens({ accessToken: null });
    expect(localStorage.getItem('access_token')).toBeNull();
  });
});
