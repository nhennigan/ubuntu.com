import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { add, format } from "date-fns";
import { Formik } from "formik";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { render, screen } from "@testing-library/react";
import * as useCalculate from "../../hooks/useCalculate";
import * as usePreview from "../../hooks/usePreview";
import { CUEProduct, taxInfo, UAProduct } from "../../utils/test/Mocks";
import Summary from "./Summary";

const DATE_FORMAT = "dd MMMM yyyy";

describe("Summary", () => {
  let queryClient: QueryClient;
  const stripePromise = loadStripe(window.stripePublishableKey ?? "");

  beforeEach(async () => {
    queryClient = new QueryClient();
  });

  beforeAll(() => {
    Object.defineProperty(window, "productList", {
      value: {
        "uaia-essential-physical-yearly": {
          ...UAProduct,
          price: { value: 10000 },
        },
        "uaia-essential-physical-monthly": {
          ...UAProduct,
          id: "uaia-essential-physical-monthly",
          period: "monthly",
        },
      },
    });
  });

  it("renders correctly with no preview", () => {
    jest.spyOn(usePreview, "default").mockImplementation(() => {
      return {
        isLoading: false,
        data: undefined,
        isError: false,
        isSuccess: true,
        error: null,
        isFetching: false,
      };
    });

    jest.spyOn(useCalculate, "default").mockImplementation(() => {
      return {
        isLoading: false,
        data: undefined,
        isError: false,
        isSuccess: true,
        error: null,
        isFetching: false,
      };
    });
    const products = [
      {
        product: UAProduct,
        quantity: 3,
      },
    ];
    render(
      <QueryClientProvider client={queryClient}>
        <Formik initialValues={{}} onSubmit={jest.fn()}>
          <Elements stripe={stripePromise}>
            <Summary
              products={products}
              action={"purchase"}
              setError={jest.fn()}
              setErrorType={jest.fn()}
              setIsTotalLoading={jest.fn()}
              coupon={{ origin: "", IDs: [] }}
            />
          </Elements>
        </Formik>
      </QueryClientProvider>,
    );

    expect(screen.getByText("Ubuntu Pro")).toBeInTheDocument();
    expect(screen.getByText("3 x $500.00")).toBeInTheDocument();
    expect(screen.getByTestId("start-date")).toHaveTextContent(
      format(new Date(), DATE_FORMAT),
    );
    expect(screen.getByTestId("end-date")).toHaveTextContent(
      format(
        add(new Date(), {
          years: 1,
        }),
        DATE_FORMAT,
      ),
    );

    expect(screen.getByTestId("subtotal")).toHaveTextContent("$1,500.00");
  });

  it("renders correctly with a preview with tax amount", () => {
    jest.spyOn(usePreview, "default").mockImplementation(() => {
      return {
        isLoading: false,
        data: {
          ...taxInfo,
          tax: 999,
          total: 12345,
        },
        isError: false,
        isSuccess: true,
        error: null,
        isFetching: false,
      };
    });
    const products = [
      {
        product: UAProduct,
        quantity: 3,
      },
    ];
    render(
      <QueryClientProvider client={queryClient}>
        <Formik initialValues={{}} onSubmit={jest.fn()}>
          <Elements stripe={stripePromise}>
            <Summary
              products={products}
              action={"purchase"}
              setError={jest.fn()}
              setErrorType={jest.fn()}
              setIsTotalLoading={jest.fn()}
              coupon={{ origin: "", IDs: [] }}
            />
          </Elements>
        </Formik>
      </QueryClientProvider>,
    );

    expect(screen.getByTestId("tax")).toHaveTextContent("$9.99");
    expect(screen.getByTestId("total")).toHaveTextContent("$123.45");
  });

  it("renders correctly with a preview with a different end of cycle", () => {
    jest.spyOn(usePreview, "default").mockImplementation(() => {
      return {
        isLoading: true,
        data: {
          ...taxInfo,
          tax: 10000,
          total: 30000,
          end_of_cycle: "2042-02-03T16:32:54Z",
        },
        isError: false,
        isSuccess: true,
        error: null,
        isFetching: false,
      };
    });
    const products = [
      {
        product: UAProduct,
        quantity: 3,
      },
    ];
    render(
      <QueryClientProvider client={queryClient}>
        <Formik initialValues={{}} onSubmit={jest.fn()}>
          <Elements stripe={stripePromise}>
            <Summary
              products={products}
              action={"purchase"}
              setError={jest.fn()}
              setErrorType={jest.fn()}
              setIsTotalLoading={jest.fn()}
              coupon={{ origin: "", IDs: [] }}
            />
          </Elements>
        </Formik>
      </QueryClientProvider>,
    );

    expect(screen.getByTestId("for-this-period")).toHaveTextContent("$200.00");
    expect(screen.getByTestId("end-date")).toHaveTextContent(
      "03 February 2042",
    );
  });

  it("renders correctly with a preview error", () => {
    jest.spyOn(usePreview, "default").mockImplementation(() => {
      return {
        isLoading: false,
        data: {
          ...taxInfo,
          tax: 10000,
          total: 30000,
          end_of_cycle: "2042-02-03T16:32:54Z",
        },
        isError: true,
        isSuccess: true,
        error: { name: "", message: "error" },
        isFetching: false,
      };
    });
    const products = [
      {
        product: UAProduct,
        quantity: 3,
      },
    ];
    render(
      <QueryClientProvider client={queryClient}>
        <Formik initialValues={{}} onSubmit={jest.fn()}>
          <Elements stripe={stripePromise}>
            <Summary
              products={products}
              action={"purchase"}
              setError={jest.fn()}
              setErrorType={jest.fn()}
              setIsTotalLoading={jest.fn()}
              coupon={{ origin: "", IDs: [] }}
            />
          </Elements>
        </Formik>
      </QueryClientProvider>,
    );

    screen.getByText("Purchase error");
  });

  it("renders trial error message preview error", () => {
    jest.spyOn(usePreview, "default").mockImplementation(() => {
      return {
        isLoading: false,
        data: {
          ...taxInfo,
          tax: 10000,
          total: 30000,
          end_of_cycle: "2042-02-03T16:32:54Z",
        },
        isError: true,
        isSuccess: false,
        error: new Error(
          "cannot make a purchase while subscription is in trial",
        ),
        isFetching: false,
      };
    });
    const products = [
      {
        product: UAProduct,
        quantity: 3,
      },
    ];
    const setError = jest.fn();
    render(
      <QueryClientProvider client={queryClient}>
        <Formik initialValues={{}} onSubmit={jest.fn()}>
          <Elements stripe={stripePromise}>
            <Summary
              products={products}
              action={"purchase"}
              setError={setError}
              setErrorType={jest.fn()}
              setIsTotalLoading={jest.fn()}
              coupon={{ origin: "", IDs: [] }}
            />
          </Elements>
        </Formik>
      </QueryClientProvider>,
    );

    const message = {
      description: (
        <>
          You cannot make a purchase during the trial period. To make a new
          purchase, cancel your current trial subscription.
        </>
      ),
    };

    expect(setError).toHaveBeenCalledWith(message);
  });

  it("renders pending purchase error message preview error", () => {
    jest.spyOn(usePreview, "default").mockImplementation(() => {
      return {
        isLoading: false,
        data: {
          ...taxInfo,
          tax: 10000,
          total: 30000,
          end_of_cycle: "2042-02-03T16:32:54Z",
        },
        isError: true,
        isSuccess: false,
        error: new Error("can only make one purchase at a time"),
        isFetching: false,
      };
    });
    const products = [
      {
        product: UAProduct,
        quantity: 3,
      },
    ];
    const setError = jest.fn();
    render(
      <QueryClientProvider client={queryClient}>
        <Formik initialValues={{}} onSubmit={jest.fn()}>
          <Elements stripe={stripePromise}>
            <Summary
              products={products}
              action={"purchase"}
              setError={setError}
              setErrorType={jest.fn()}
              setIsTotalLoading={jest.fn()}
              coupon={{ origin: "", IDs: [] }}
            />
          </Elements>
        </Formik>
      </QueryClientProvider>,
    );

    const message = {
      description: (
        <>
          You already have a pending purchase. Please go to{" "}
          <a href="/account/payment-methods">payment methods</a> to retry.
        </>
      ),
    };

    expect(setError).toHaveBeenCalledWith(message);
  });

  it("renders cue banned user purchase error", () => {
    jest.spyOn(usePreview, "default").mockImplementation(() => {
      return {
        isLoading: false,
        data: {
          ...taxInfo,
          tax: 10000,
          total: 30000,
          end_of_cycle: "2042-02-03T16:32:54Z",
        },
        isError: true,
        isSuccess: false,
        error: new Error(
          "invalid purchase: user has been banned from purchasing products in the canonical-cube marketplace",
        ),
        isFetching: false,
      };
    });
    const products = [
      {
        product: CUEProduct,
        quantity: 1,
      },
    ];
    const setError = jest.fn();
    render(
      <QueryClientProvider client={queryClient}>
        <Formik initialValues={{}} onSubmit={jest.fn()}>
          <Elements stripe={stripePromise}>
            <Summary
              products={products}
              action={"purchase"}
              setError={setError}
              setErrorType={jest.fn()}
              setIsTotalLoading={jest.fn()}
              coupon={{ origin: "", IDs: [] }}
            />
          </Elements>
        </Formik>
      </QueryClientProvider>,
    );

    const message = {
      description: (
        <>
          You cannot make this purchase as your account has been banned from
          purchasing CUE exams.
        </>
      ),
    };

    expect(setError).toHaveBeenCalledWith(message);
  });

  it("renders unexpected error message preview error", () => {
    jest.spyOn(usePreview, "default").mockImplementation(() => {
      return {
        isLoading: false,
        data: {
          ...taxInfo,
          tax: 10000,
          total: 30000,
          end_of_cycle: "2042-02-03T16:32:54Z",
        },
        isError: true,
        isSuccess: false,
        error: new Error("unexpected error"),
        isFetching: false,
      };
    });
    const products = [
      {
        product: UAProduct,
        quantity: 3,
      },
    ];
    const setError = jest.fn();
    render(
      <QueryClientProvider client={queryClient}>
        <Formik initialValues={{}} onSubmit={jest.fn()}>
          <Elements stripe={stripePromise}>
            <Summary
              products={products}
              action={"purchase"}
              setError={setError}
              setErrorType={jest.fn()}
              setIsTotalLoading={jest.fn()}
              coupon={{ origin: "", IDs: [] }}
            />
          </Elements>
        </Formik>
      </QueryClientProvider>,
    );

    const message = {
      description: <>Sorry, there was an unknown error with your purchase.</>,
    };

    expect(setError).toHaveBeenCalledWith(message);
  });
});
