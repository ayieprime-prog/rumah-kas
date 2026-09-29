import { render, screen } from '@testing-library/react'
import { Suspense } from 'react'
import {
  SkeletonCard,
  SkeletonDashboard,
  SkeletonList,
  SkeletonTable,
  SkeletonChart,
  SkeletonForm,
  SkeletonPage,
  withSkeleton
} from '../AppShell/Skeleton'

describe('Skeleton components', () => {
  it.each([
    ['SkeletonCard', SkeletonCard],
    ['SkeletonDashboard', SkeletonDashboard],
    ['SkeletonList', SkeletonList],
    ['SkeletonTable', SkeletonTable],
    ['SkeletonChart', SkeletonChart],
    ['SkeletonForm', SkeletonForm],
    ['SkeletonPage', SkeletonPage]
  ])('%s renders without crashing', (name, Component) => {
    const { container } = render(<Component />)
    expect(container.firstChild).not.toBeNull()
  })

  it('SkeletonList renders five placeholder rows', () => {
    const { container } = render(<SkeletonList />)
    const wrapper = container.firstChild
    expect(wrapper.children.length).toBe(5)
  })

  it('SkeletonTable renders a header row plus three data rows', () => {
    const { container } = render(<SkeletonTable />)
    const rows = container.querySelectorAll('.grid-cols-4')
    expect(rows.length).toBe(4) // 1 header + 3 rows
  })
})

describe('withSkeleton', () => {
  function SlowComponent() {
    return <div>Loaded</div>
  }

  it('wraps a component in a Suspense boundary using the given fallback', () => {
    const Wrapped = withSkeleton(SlowComponent, SkeletonCard)
    render(<Wrapped />)
    // Since SlowComponent isn't actually lazy/suspending, it renders immediately
    expect(screen.getByText('Loaded')).toBeInTheDocument()
  })
})
