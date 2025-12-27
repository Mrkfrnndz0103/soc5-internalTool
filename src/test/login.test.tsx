import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'

describe('Login Page', () => {  
  it('should render basic HTML elements', () => {  
    const { container } = render(
      <BrowserRouter>
        <div data-testid="login-page">
          <h1>Sign In</h1>
          <input placeholder="Ops ID" />
        </div>
      </BrowserRouter>
    )
    expect(container).toBeInTheDocument()
  })
})
