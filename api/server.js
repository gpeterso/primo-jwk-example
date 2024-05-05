import express from "express";
import jwks from "jwks-rsa";
import cors from "cors";
import { expressjwt } from "express-jwt";
import "express-async-errors";
import "dotenv/config";

const app = express();

// enable CORS
app.use(
  cors({
    methods: "GET",
    origin: "*", // normally, you'd want explicitly list your primo origins
  })
);

// token validation middleware
app.use(
  expressjwt({
    // keys are cached for 10 minutes by default
    secret: jwks.expressJwtSecret({
      jwksUri: process.env.JWKS_URI,
      rateLimit: true,
    }),
    algorithms: ["ES256"],
  })
);

// Once a token is validated, you could optionally check some of its
// claims before proceeding. Remember: guest tokens are still valid tokens.
app.use((req, res, next) => {
  if (req.auth?.signedIn === "true") {
    next();
  } else {
    res.sendStatus(403);
  }
});

// Now that know we have a valid, non-guest token, let's look up the user
// in Alma and return their loan count;
app.get("/loan-count", async (req, res) => {
  const id = req.auth.userName;
  const user = await getAlmaUser(id);
  res.json({
    loanCount: user.loans.value,
    requestCount: user.requests.value,
  });
});

app.listen(8000);

function getAlmaUser(id) {
  const headers = {
    Authorization: `apikey ${process.env.ALMA_API_KEY}`,
    Accept: "application/json",
    "Content-type": "application/json",
  };
  const url = `${process.env.ALMA_API_BASE_URL}/users/${id}?expand=loans,requests`;
  return fetch(url, { headers }).then((res) => res.json());
}
