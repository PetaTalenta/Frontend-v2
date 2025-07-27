"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Search, School as SchoolIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getSchools, getSchoolsByLocation, validateSchoolId, type School } from "@/services/school-api"

interface SchoolSelectorProps {
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  token?: string
  allowManualEntry?: boolean
}

export function SchoolSelector({
  value,
  onValueChange,
  placeholder = "Select a school...",
  disabled = false,
  token,
  allowManualEntry = true
}: SchoolSelectorProps) {
  const [open, setOpen] = React.useState(false)
  const [schools, setSchools] = React.useState<School[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string>('')
  const [searchQuery, setSearchQuery] = React.useState('')
  const [manualEntry, setManualEntry] = React.useState(false)
  const [manualSchoolId, setManualSchoolId] = React.useState('')
  const [validatingId, setValidatingId] = React.useState(false)
  const [validationError, setValidationError] = React.useState('')

  // Load schools on component mount
  React.useEffect(() => {
    loadSchools()
  }, [token])

  const loadSchools = async () => {
    setLoading(true)
    setError('')
    
    try {
      const response = await getSchools(token)
      
      if (response.success && response.data) {
        setSchools(response.data)
      } else {
        setError(response.error?.message || 'Failed to load schools')
      }
    } catch (err) {
      console.error('Error loading schools:', err)
      setError('Failed to load schools')
    } finally {
      setLoading(false)
    }
  }

  // Filter schools based on search query
  const filteredSchools = React.useMemo(() => {
    if (!searchQuery) return schools
    
    return schools.filter(school =>
      school.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      school.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      school.province?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      school.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      school.id.toString().includes(searchQuery)
    )
  }, [schools, searchQuery])

  // Find selected school
  const selectedSchool = React.useMemo(() => {
    if (!value) return null
    const schoolId = parseInt(value)
    return schools.find(school => school.id === schoolId) || null
  }, [value, schools])

  // Handle school selection
  const handleSchoolSelect = (schoolId: string) => {
    onValueChange(schoolId)
    setOpen(false)
    setManualEntry(false)
    setValidationError('')
  }

  // Handle manual ID entry
  const handleManualIdChange = (id: string) => {
    setManualSchoolId(id)
    setValidationError('')
  }

  // Validate manual school ID
  const validateManualId = async () => {
    if (!manualSchoolId.trim()) {
      setValidationError('Please enter a school ID')
      return
    }

    const schoolId = parseInt(manualSchoolId)
    if (isNaN(schoolId) || schoolId <= 0) {
      setValidationError('School ID must be a positive number')
      return
    }

    setValidatingId(true)
    setValidationError('')

    try {
      const isValid = await validateSchoolId(schoolId, token)
      
      if (isValid) {
        onValueChange(schoolId.toString())
        setManualEntry(false)
        setManualSchoolId('')
        setOpen(false)
      } else {
        setValidationError(`School with ID ${schoolId} does not exist`)
      }
    } catch (err) {
      console.error('Error validating school ID:', err)
      setValidationError('Failed to validate school ID')
    } finally {
      setValidatingId(false)
    }
  }

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled}
          >
            <div className="flex items-center space-x-2">
              <SchoolIcon className="w-4 h-4 text-gray-500" />
              <span className="truncate">
                {selectedSchool ? selectedSchool.name : placeholder}
              </span>
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput 
              placeholder="Search schools..." 
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              {loading ? (
                <div className="p-4 text-center text-sm text-gray-500">
                  Loading schools...
                </div>
              ) : error ? (
                <div className="p-4 text-center text-sm text-red-500">
                  {error}
                </div>
              ) : (
                <>
                  <CommandEmpty>
                    <div className="p-4 text-center">
                      <p className="text-sm text-gray-500 mb-2">No schools found.</p>
                      {allowManualEntry && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setManualEntry(true)}
                        >
                          Enter School ID Manually
                        </Button>
                      )}
                    </div>
                  </CommandEmpty>
                  <CommandGroup>
                    {filteredSchools.map((school) => (
                      <CommandItem
                        key={school.id}
                        value={school.id.toString()}
                        onSelect={() => handleSchoolSelect(school.id.toString())}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            value === school.id.toString() ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="flex-1">
                          <div className="font-medium">{school.name}</div>
                          <div className="text-sm text-gray-500">
                            ID: {school.id} • {school.location || school.city}
                            {school.province && `, ${school.province}`}
                          </div>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  {allowManualEntry && filteredSchools.length > 0 && (
                    <div className="border-t p-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full"
                        onClick={() => setManualEntry(true)}
                      >
                        Enter School ID Manually
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Manual entry dialog */}
      {manualEntry && (
        <div className="border rounded-md p-4 space-y-3 bg-gray-50">
          <div className="flex items-center justify-between">
            <Label htmlFor="manual-school-id" className="text-sm font-medium">
              Enter School ID Manually
            </Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setManualEntry(false)
                setManualSchoolId('')
                setValidationError('')
              }}
            >
              Cancel
            </Button>
          </div>
          <div className="space-y-2">
            <Input
              id="manual-school-id"
              type="number"
              placeholder="Enter school ID"
              value={manualSchoolId}
              onChange={(e) => handleManualIdChange(e.target.value)}
              disabled={validatingId}
            />
            {validationError && (
              <p className="text-sm text-red-500">{validationError}</p>
            )}
            <Button
              onClick={validateManualId}
              disabled={validatingId || !manualSchoolId.trim()}
              size="sm"
              className="w-full"
            >
              {validatingId ? 'Validating...' : 'Validate & Select'}
            </Button>
          </div>
          <p className="text-xs text-gray-500">
            Note: The school ID will be validated against the database before being accepted.
          </p>
        </div>
      )}

      {/* Display current selection */}
      {selectedSchool && (
        <div className="text-sm text-gray-600">
          Selected: {selectedSchool.name} (ID: {selectedSchool.id})
        </div>
      )}
    </div>
  )
}
