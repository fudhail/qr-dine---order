import crypto from 'crypto';

/**
 * Mock Syscon Hotel Management System Integration Driver
 */
export const sysconAPI = {
  /**
   * Validate Room status & Guest details with Syscon HMS
   * @param {string} room 
   * @returns {Promise<{success: boolean, guestName?: string, checkIn?: string, checkOut?: string, sysconGuestId?: string, error?: string}>}
   */
  validateGuestRoom: async (room) => {
    console.log(`[SYSCON HMS] Validating room ${room} status...`);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Mock guest folio lookup
    const mockFolios = {
      '101': { guestName: 'John Smith', checkIn: '2026-07-10', checkOut: '2026-07-14', sysconGuestId: 'SYSCON-G-8812', billId: 'bill_1783712169414_379' },
      '102': { guestName: 'Sarah Connor', checkIn: '2026-07-09', checkOut: '2026-07-12', sysconGuestId: 'SYSCON-G-7103', billId: 'bill_1715000000_2' },
      '103': { guestName: 'Michael Rossi', checkIn: '2026-07-10', checkOut: '2026-07-15', sysconGuestId: 'SYSCON-G-4491', billId: 'bill_1715000000_3' }
    };

    if (mockFolios[room]) {
      return { success: true, ...mockFolios[room] };
    }
    return { success: false, error: 'Room is currently vacant or not registered in Syscon HMS' };
  },

  /**
   * Post room service / hospitality charge to guest folio in Syscon HMS
   * @param {object} order 
   * @returns {Promise<{success: boolean, transactionId?: string, error?: string}>}
   */
  postFolioCharge: async (order) => {
    console.log(`[SYSCON HMS] Posting charge for Order ${order.id} (Room ${order.room}) - Total: INR ${order.total}...`);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Randomize failure slightly (5% chance) for demonstration of retry handling
    if (Math.random() < 0.05) {
      console.error(`[SYSCON HMS] Connection timeout posting folio charge for Order ${order.id}`);
      return { success: false, error: 'Syscon Server Timeout (504)' };
    }

    const transactionId = 'SYS-TXN-' + crypto.randomBytes(4).toString('hex').toUpperCase();
    console.log(`[SYSCON HMS] Charge posted successfully. Transaction ID: ${transactionId}`);
    return { success: true, transactionId };
  }
};
