import { render, screen } from '@testing-library/react';
import React from 'react';

function Dummy() { return <div>Hello</div>; }

test('renders', () => {
  render(<Dummy />);
  expect(screen.getByText('Hello')).toBeInTheDocument();
});

