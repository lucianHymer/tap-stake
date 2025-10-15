.PHONY: lint lint-fix

# Run solhint linter (uses npx to run from project root)
lint:
	npx solhint --config .solhintrc.json 'src/**/*.sol'

# Run slither (requires slither-analyzer to be installed)
slither:
	@which slither > /dev/null || (echo "Please install slither: pip3 install slither-analyzer" && exit 1)
	slither .

# Format code with forge fmt
format:
	forge fmt

# Check formatting
format-check:
	forge fmt --check

# Run all checks
check: format-check lint
