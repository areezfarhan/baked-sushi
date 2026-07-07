// Helper function to format phone number for WhatsApp
export const formatPhoneNumber = (phone) => {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '')
  
  // If starts with '0', replace with '60'
  if (cleaned.startsWith('0')) {
    cleaned = '60' + cleaned.slice(1)
  }
  
  // If starts with '6' but not '60', assume it's missing the '0'
  if (cleaned.startsWith('6') && !cleaned.startsWith('60')) {
    cleaned = '60' + cleaned.slice(1)
  }
  
  return cleaned
}