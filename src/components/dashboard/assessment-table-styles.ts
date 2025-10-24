// Reusable styles for AssessmentTable component

export const tableStyles = {
  container: {
    backgroundColor: 'white',
    display: 'flex',
    flexDirection: 'column' as const,
    borderRadius: '0.5rem',
    border: '1px solid #eaecf0',
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    height: 'auto'
  },
  
  header: {
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
    flexWrap: 'nowrap' as const,
    gap: '0.75rem',
    padding: '1.25rem'
  },
  
  headerMobile: {
    flexDirection: 'column' as const,
    alignItems: 'flex-start',
    justifyContent: 'flex-start'
  },
  
  headerContent: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem'
  },
  
  title: {
    fontWeight: 600,
    color: '#1e1e1e',
    fontSize: '1.125rem',
    lineHeight: '1.75rem'
  },
  
  description: {
    fontSize: '0.75rem',
    marginTop: '0.25rem',
    color: '#64707d'
  },
  
  headerActions: {
    display: 'flex',
    gap: '0.5rem',
    marginLeft: 'auto',
    width: 'auto',
    justifyContent: 'flex-end'
  },
  
  headerActionsMobile: {
    width: '100%'
  },
  
  newAssessmentButton: {
    color: 'white',
    fontSize: '0.875rem',
    height: '2.5rem',
    paddingLeft: '1rem',
    paddingRight: '1rem',
    backgroundColor: '#6475E9',
    width: 'auto',
    justifyContent: 'center'
  },
  
  newAssessmentButtonMobile: {
    width: '100%'
  },
  
  tableContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    flex: 1,
    minHeight: '0',
    padding: '1rem'
  },
  
  tableWrapper: {
    flex: 1,
    overflowX: 'auto' as const,
    overflowY: 'visible' as const,
    WebkitOverflowScrolling: 'touch' as const,
    scrollbarWidth: 'thin' as const
  },
  
  table: {
    minWidth: '100%'
  },
  
  tableMobile: {
    minWidth: '600px'
  },
  
  tableRow: {
    borderColor: '#eaecf0'
  },
  
  tableHeader: {
    fontWeight: 500,
    color: '#64707d',
    paddingLeft: '0.5rem',
    paddingRight: '0.5rem',
    paddingTop: '0.5rem',
    paddingBottom: '0.5rem',
    fontSize: '0.875rem'
  },
  
  tableHeaderMobile: {
    paddingLeft: '1rem',
    paddingRight: '1rem',
    fontSize: '0.75rem'
  },
  
  tableCell: {
    color: '#1e1e1e',
    paddingLeft: '0.5rem',
    paddingRight: '0.5rem',
    paddingTop: '0.5rem',
    paddingBottom: '0.5rem',
    fontSize: '0.875rem'
  },
  
  tableCellMobile: {
    paddingLeft: '1rem',
    paddingRight: '1rem',
    fontSize: '0.75rem'
  },
  
  tableCellSecondary: {
    color: '#64707d'
  },
  
  statusBadge: {
    backgroundColor: '#f3f3f3',
    color: '#6475E9',
    padding: '0.25rem 0.5rem',
    borderRadius: '0.25rem',
    fontSize: '0.75rem',
    fontWeight: 500,
    display: 'inline-block'
  },
  
  actionButtons: {
    display: 'flex',
    gap: '0.5rem'
  },
  
  actionButton: {
    height: '2rem',
    width: '2rem'
  },
  
  actionButtonMobile: {
    height: '1.5rem',
    width: '1.5rem'
  },
  
  actionIcon: {
    width: '1rem',
    height: '1rem',
    color: '#64707d'
  },
  
  actionIconMobile: {
    width: '0.75rem',
    height: '0.75rem'
  },
  
  pagination: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1rem',
    borderTop: '1px solid #e5e7eb',
    marginTop: '1rem',
    flexShrink: 0,
    flexDirection: 'row' as const,
    gap: '0'
  },
  
  paginationMobile: {
    flexDirection: 'column' as const,
    gap: '1rem',
    padding: '0.5rem'
  },
  
  paginationControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  
  paginationText: {
    fontSize: '0.875rem',
    color: '#64707d'
  },
  
  paginationTextMobile: {
    fontSize: '0.75rem'
  },
  
  paginationSelect: {
    width: '4rem',
    height: '2rem'
  },
  
  paginationSelectMobile: {
    width: '3rem',
    height: '1.5rem'
  },
  
  paginationButtons: {
    display: 'flex',
    gap: '0.25rem',
    backgroundColor: 'transparent',
    justifyContent: 'center'
  },
  
  paginationButton: {
    width: '2rem',
    height: '2rem',
    borderRadius: '0.375rem',
    backgroundColor: '#f3f3f3',
    color: '#64707d',
    fontSize: '0.875rem'
  },
  
  paginationButtonActive: {
    backgroundColor: '#6475E9',
    color: 'white'
  },
  
  paginationButtonMobile: {
    width: '1.5rem',
    height: '1.5rem',
    fontSize: '0.75rem'
  },
  
  pendingText: {
    marginLeft: '0.5rem',
    fontSize: '0.75rem',
    color: '#6b7280',
    fontStyle: 'italic'
  },
  
  emptyRow: {
    borderColor: '#eaecf0',
    opacity: 0.5
  }
}

// Responsive style helpers
export const getResponsiveStyles = (windowWidth: number) => ({
  header: windowWidth >= 640 ? tableStyles.header : { ...tableStyles.header, ...tableStyles.headerMobile },
  headerActions: windowWidth >= 640 ? tableStyles.headerActions : { ...tableStyles.headerActions, ...tableStyles.headerActionsMobile },
  newAssessmentButton: windowWidth >= 640 ? tableStyles.newAssessmentButton : { ...tableStyles.newAssessmentButton, ...tableStyles.newAssessmentButtonMobile },
  tableContainer: windowWidth >= 768 ? tableStyles.tableContainer : { ...tableStyles.tableContainer, padding: '1.5rem' },
  table: windowWidth >= 640 ? tableStyles.table : { ...tableStyles.table, ...tableStyles.tableMobile },
  tableHeader: windowWidth >= 768 ? tableStyles.tableHeader : { ...tableStyles.tableHeader, ...tableStyles.tableHeaderMobile },
  tableCell: windowWidth >= 768 ? tableStyles.tableCell : { ...tableStyles.tableCell, ...tableStyles.tableCellMobile },
  actionButton: windowWidth >= 640 ? tableStyles.actionButton : { ...tableStyles.actionButton, ...tableStyles.actionButtonMobile },
  actionIcon: windowWidth >= 640 ? tableStyles.actionIcon : { ...tableStyles.actionIcon, ...tableStyles.actionIconMobile },
  pagination: windowWidth >= 640 ? tableStyles.pagination : { ...tableStyles.pagination, ...tableStyles.paginationMobile },
  paginationText: windowWidth >= 640 ? tableStyles.paginationText : { ...tableStyles.paginationText, ...tableStyles.paginationTextMobile },
  paginationSelect: windowWidth >= 640 ? tableStyles.paginationSelect : { ...tableStyles.paginationSelect, ...tableStyles.paginationSelectMobile },
  paginationButton: windowWidth >= 640 ? tableStyles.paginationButton : { ...tableStyles.paginationButton, ...tableStyles.paginationButtonMobile }
})