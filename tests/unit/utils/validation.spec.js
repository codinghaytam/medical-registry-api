import { validatePhone } from '../../../src/utils/validation';
function mockRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}
describe('utils/validation.validatePhone', () => {
    test('allows request when phone not provided', () => {
        const req = { body: {} };
        const res = mockRes();
        const next = jest.fn();
        validatePhone(req, res, next);
        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
    });
    test('allows empty string to clear phone', () => {
        const req = { body: { phone: '' } };
        const res = mockRes();
        const next = jest.fn();
        validatePhone(req, res, next);
        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
    });
    test('accepts valid international phone numbers', () => {
        const validPhones = ['+12345678901', '1234567890', '+331234567890', '123456789012345'];
        for (const phone of validPhones) {
            const req = { body: { phone } };
            const res = mockRes();
            const next = jest.fn();
            validatePhone(req, res, next);
            expect(next).toHaveBeenCalled();
        }
    });
    test('rejects invalid phone numbers', () => {
        const invalidPhones = ['+12', 'abc123', '+123-456-7890', '123 456 7890', '+', '1234567890123456'];
        for (const phone of invalidPhones) {
            const req = { body: { phone } };
            const res = mockRes();
            const next = jest.fn();
            validatePhone(req, res, next);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
            expect(next).not.toHaveBeenCalled();
        }
    });
});
