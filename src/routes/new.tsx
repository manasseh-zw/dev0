'use client'

import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { useStore } from '@tanstack/react-store'
import { Nextjs, TanStack, React } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { ThemeSwitcher } from '@/components/theme-switcher'
import { appStore, appActions } from '@/lib/state'
import { createProject } from '@/lib/actions'
import { useEffect } from 'react'

export const Route = createFileRoute('/new')({ component: NewProjectPage })

const techStacks = [
  {
    id: 'nextjs',
    title: 'Next.js',
    description: 'Full-stack React framework with server-side rendering',
    Icon: Nextjs,
  },
  {
    id: 'tanstack-start',
    title: 'TanStack Start',
    description: 'Full-stack framework powered by TanStack Router',
    Icon: TanStack,
  },
  {
    id: 'react-vite',
    title: 'React',
    description: 'Pure React with Vite for fast development',
    Icon: React,
  },
]

function NewProjectPage() {
  const navigate = useNavigate()
  const previewData = useStore(appStore, (state) => state.previewData)
  const vibeInput = useStore(appStore, (state) => state.vibeInput)
  const isCreatingProject = useStore(
    appStore,
    (state) => state.isCreatingProject,
  )

  useEffect(() => {
    if (!previewData) {
      navigate({ to: '/' })
    }
  }, [previewData, navigate])

  const form = useForm({
    defaultValues: {
      projectName: previewData?.name || 'My Awesome Project',
      description:
        previewData?.description ||
        'A modern web application built with the latest technologies.',
      techStack: previewData?.suggestedTechStack || 'nextjs',
    },
    onSubmit: async ({ value }) => {
      try {
        appActions.setCreatingProject(true)

        const result = await createProject({
          data: {
            name: value.projectName,
            description: value.description,
            vibeInput,
            techStack: value.techStack as
              | 'tanstack-start'
              | 'react-vite'
              | 'nextjs',
          },
        })

        appActions.setCurrentProjectId(result.projectId)

        navigate({ to: result.redirectUrl })
      } catch (error) {
        console.error('Error creating project:', error)
        alert('Failed to create project. Please try again.')
        appActions.setCreatingProject(false)
      }
    },
  })

  return (
    <main className="min-h-screen w-screen bg-background overflow-auto flex items-center relative">
      <div className="absolute right-4 top-4">
        <ThemeSwitcher />
      </div>
      <div className="mx-auto flex max-w-3xl items-center justify-center p-10">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            form.handleSubmit()
          }}
          className="w-full"
        >
          {/* Project Information Section */}
          <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
            <div>
              <h2 className="text-foreground font-semibold">
                Project Information
              </h2>
              <p className="text-muted-foreground mt-1 text-sm leading-6">
                Configure the basic details of your new project.
              </p>
            </div>
            <div className="sm:max-w-3xl md:col-span-2">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-6">
                {/* Project Name */}
                <div className="col-span-full">
                  <form.Field
                    name="projectName"
                    children={(field) => (
                      <>
                        <Label
                          htmlFor={field.name}
                          className="text-foreground text-sm font-medium"
                        >
                          Project Name
                        </Label>
                        <Input
                          type="text"
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="My Awesome Project"
                          className="mt-2"
                        />
                      </>
                    )}
                  />
                </div>

                {/* Description */}
                <div className="col-span-full">
                  <form.Field
                    name="description"
                    children={(field) => (
                      <>
                        <Label
                          htmlFor={field.name}
                          className="text-foreground text-sm font-medium"
                        >
                          Description
                        </Label>
                        <Textarea
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="Describe your project..."
                          className="mt-2"
                          rows={4}
                        />
                        <p className="text-muted-foreground mt-2 text-xs">
                          A brief description of what your project does.
                        </p>
                      </>
                    )}
                  />
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-8" />

          {/* Project Settings Section */}
          <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
            <div>
              <h2 className="text-foreground font-semibold">
                Project Settings
              </h2>
              <p className="text-muted-foreground mt-1 text-sm leading-6">
                Choose the technology stack for your project.
              </p>
            </div>
            <div className="sm:max-w-3xl md:col-span-2">
              <fieldset>
                <form.Field
                  name="techStack"
                  children={(field) => (
                    <RadioGroup
                      className="grid grid-cols-1 gap-5 sm:grid-cols-2"
                      value={field.state.value}
                      onValueChange={(value) => field.handleChange(value)}
                    >
                      {techStacks.map((item) => (
                        <div
                          key={item.id}
                          className="border-input has-data-[state=checked]:border-ring relative flex flex-col gap-3 rounded-lg border p-4 outline-none transition-colors hover:bg-muted/50"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                                <item.Icon className="size-5" />
                              </div>
                              <Label
                                htmlFor={item.id}
                                className="text-foreground block text-sm font-medium cursor-pointer"
                              >
                                {item.title}
                              </Label>
                            </div>
                            <RadioGroupItem
                              id={item.id}
                              value={item.id}
                              className="after:absolute after:inset-0"
                            />
                          </div>
                          <p className="text-muted-foreground text-sm">
                            {item.description}
                          </p>
                        </div>
                      ))}
                    </RadioGroup>
                  )}
                />
              </fieldset>
            </div>
          </div>

          <Separator className="my-8" />

          {/* Submit Button */}
          <div className="flex items-center justify-end">
            <Button
              type="submit"
              size="lg"
              className="px-8"
              disabled={isCreatingProject}
            >
              {isCreatingProject ? 'Creating Project...' : 'Create Project'}
            </Button>
          </div>
        </form>
      </div>
    </main>
  )
}
